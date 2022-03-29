from django.shortcuts import render, redirect
from django.http import HttpResponse

from home.models import CustomUser, Activity, Group, Group_Membership, Friend, Bill, Settlement
from django.db.models import Q
from django.contrib.auth import logout
from django.contrib.auth import authenticate, login

from django.db.utils import IntegrityError
import re
import json
from django.core.serializers.json import DjangoJSONEncoder
from datetime import date, datetime
from functools import reduce
from django.core import serializers

from django.contrib import messages
from django.views.decorators.cache import cache_control

from django.core.mail import send_mail, BadHeaderError
from django.contrib.auth.forms import PasswordResetForm
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes




# helper funtions

def get_paid_debts(current_paid_amount, must_pay):
    if current_paid_amount >= must_pay:
        return (current_paid_amount, 0)
    return(current_paid_amount, must_pay-current_paid_amount)

def is_bill_settled(settlements):

    for row in settlements:
        if row.debt != 0:
            return False
    
    return True


# return json_data for add_friends
def invite_friend(request):
    user_id = request.POST.get('friend_id')

    friend_user = CustomUser.objects.get(id=user_id)
    current_user = request.user

    try:
        group = Group(group_name='Friends', status='PENDING', date=datetime.now() )
        group.save()

        friend_row = Friend(friend1=current_user, friend2=friend_user, group_id=group, status='PENDING')
        friend_row.save()

        
        activity = Activity(user_id=friend_user, sender_id=current_user, group_id=group, message_type='INVITE',  message='lets join in!!!', status='PENDING', date=datetime.now() )

        activity.save()

        data = {
            'message' : 'Sent invite'
        }
        json_data = json.dumps(data)
        
    except IntegrityError as e:
        data = {
            'message' : 'Sent invite Failed'+str(e)
        }
        json_data = json.dumps(data)
        
    return json_data

def accept_reject_friend_request(request):
    activity_id = request.POST.get('activity_id')
    state = request.POST.get('state')

    print(activity_id)
    print(state)
    if state == 'Accept':
        try:
            current_activity = Activity.objects.get(id=activity_id)
            current_activity.status = 'ACCEPTED'
            
            g_id = current_activity.group_id.id
            
            current_group = Group.objects.get(id=g_id)
            current_group.status = 'ACTIVE'

            f1 = current_activity.user_id # this is receiver or current user
            f2 = current_activity.sender_id # this is sender user 
                # cur - parth 
                # user - part - f1
                # sender - yash - f2
            friend = Friend.objects.get(friend1=f2, friend2=f1) # first is sender and second is receiver
            friend.status = 'ACTIVE'
            friend.save()

            current_activity.save()
            current_group.save()
        except IntegrityError as e:
            data = {
                'message' : 'Accept request Failed - ' + str(e)
            }
            json_data = json.dumps(data)
            return json_data
    else:
        try:
            current_activity = Activity.objects.get(id=activity_id)
            # current_activity.status = 'REJECTED'
            # print(current_activity)
            g_id = current_activity.group_id.id
            # print(g_id)
            current_group = Group.objects.get(id=g_id)
            # print(current_group)
            current_group.delete()

        except IntegrityError as e:
            data = {
                'message' : 'Reject request Failed - '+str(e)
            }
            json_data = json.dumps(data)
            return json_data

    data = {
        'message' : state + 'ed Done.'
    }
    json_data = json.dumps(data)

    return json_data

def add_expense(request):
    friend_id = request.POST.get('friend_id')
    expense_name  = request.POST.get('expense_name')
    total_amount  = int(request.POST.get('total_amount'))
    current_user_amount  = int(request.POST.get('current_user_amount'))
    other_user_amount  = int(request.POST.get('other_user_amount'))
    split_type  = request.POST.get('split_type')
    dt  = request.POST.get('datetime')
    message  = request.POST.get('message')
    current_user_must_pay  = int(request.POST.get('current_user_must_pay'))
    other_user_must_pay  = int(request.POST.get('other_user_must_pay'))


    print(friend_id, expense_name, total_amount, current_user_amount, other_user_amount, split_type, dt, message)

    try:
        
        d = datetime.strptime(dt, '%Y-%m-%dT%H:%M')

        

        friend = CustomUser.objects.get(id=friend_id)

        friend_row = Friend.objects.filter(Q(friend1=friend, friend2=request.user) | Q(friend1=request.user, friend2=friend))[0]
        grp = friend_row.group_id

        b = Bill(bill_name=expense_name, group_id=grp, status='PENDING', date=d, amount=total_amount, split_type=split_type)
        b.save()

        activity = Activity(user_id=friend, sender_id=request.user, group_id=grp, bill_id=b, message_type='EXPENSE', message=message, status='PENDING', date=datetime.now() )
        activity.save()

        if split_type == 'percentage':
            current_user_must_pay = total_amount*(current_user_must_pay/100)
            other_user_must_pay = total_amount*(other_user_must_pay/100)

        paid1, debts1 = get_paid_debts(current_user_amount, int(current_user_must_pay))
        paid2, debts2 = get_paid_debts(other_user_amount, int(other_user_must_pay))

        settlement = Settlement(user_id=request.user, bill_id=b, group_id=grp, paid=paid1, debt=debts1)
        settlement.save()
        settlement = Settlement(user_id=friend, bill_id=b, group_id=grp, paid=paid2, debt=debts2)
        settlement.save()
        data = {
            'message' : 'Sent Expense'
        }
        json_data = json.dumps(data) 
    except IntegrityError as e:
        data = {
            'message' : 'Sent Expense Failed - ' + str(e)
        }
        json_data = json.dumps(data)

    return json_data

def get_bills_of_my_friend(request):
    
    friend_id = request.POST.get('friend_id')
    friend = CustomUser.objects.get(id=friend_id)  
    print(friend)

    friend_id = Friend.objects.filter(Q(friend1=request.user, friend2=friend) | Q(friend1=friend, friend2=request.user))[0]
    print(friend_id)

    grp_id = friend_id.group_id
    print(grp_id)

    bills_active = Activity.objects.select_related('bill_id').filter(Q(user_id=request.user, sender_id=friend) | Q(user_id=friend, sender_id=request.user), message_type='EXPENSE', status='ACCEPT')
    bills = [i.bill_id for i in bills_active]
    settlement = Settlement.objects.filter(bill_id__in=bills, user_id=request.user)

    main_dict = []

    for i in range(len(bills_active)):
        temp_settles = Settlement.objects.filter(bill_id=bills_active[i].bill_id)
        if temp_settles[0] in settlement:
            receiving_amount = temp_settles[1].debt
            current_settlement = temp_settles[0]
        else:
            receiving_amount = temp_settles[0].debt
            current_settlement = temp_settles[1]
        bills = serializers.serialize("json", [bills_active[i].bill_id,])
        current_settlement = serializers.serialize("json", [current_settlement,])
        main_dict.append({'bills': bills, 'receiving_amount': receiving_amount, 'current_settlement': current_settlement})

    data = {
        'message' : 'Bills forwarded successfully',
        'main_dict': main_dict,
    }
    json_data = json.dumps(data)

    return json_data

def get_settlements_data(request):

    bill_id = request.POST.get('bill_id')

    settlement = Settlement.objects.filter(bill_id_id=bill_id)

    data_dict = {}

    for i in settlement:
        if i.user_id == request.user:
            data_dict['paid'] = i.paid        
            data_dict['debt'] = i.debt
        else:
            data_dict['receiving_amount'] = i.debt

    

    data = {
        'message' : 'Settlement  data forwarded',
        'data_dict': data_dict

    }
    json_data = json.dumps(data)

    return json_data

def accept_reject_bill_validation(request):
    if request.POST.get('state') == 'Accept':
        try:
            bill_id = request.POST.get('bill_id')
            bill = Bill.objects.get(id=bill_id)
            print(bill)

            settlements = Settlement.objects.filter(bill_id=bill)

            if is_bill_settled(settlements):
                bill.status = 'SETTLED'
            else:
                bill.status = 'UNSETTLED'

            act = Activity.objects.get(user_id=request.user, bill_id=bill)
            act.status = 'ACCEPT'

            act.save()
            bill.save()


        except IntegrityError as e:
            data = {
                'message' : 'Bill Accept Failed - ' + str(e)
            }
            json_data = json.dumps(data)
    
    else:
        try:
            bill_id = request.POST.get('bill_id')
            bill = Bill.objects.get(id=bill_id)

            bill.delete()
            
        except IntegrityError as e:
            data = {
                'message' : 'Bill Decline Failed - ' + str(e)
            }
            json_data = json.dumps(data)

    data = {
        'message' : request.POST.get('state') + 'ed - '
    }
    json_data = json.dumps(data)

    return json_data

def settle_payment(request):
    bill_id = request.POST.get('bill_id')
    payed_amount = request.POST.get('payed_amount')

    bill = Bill.objects.get(id=bill_id)

    settlement = Settlement.objects.get(user_id=request.user, bill_id=bill)

    settlement.paid += int(payed_amount)
    settlement.debt -= int(payed_amount)

    settlement.save()

    settlement = Settlement.objects.filter(bill_id=bill)

    for i in range(len(settlement)):
        if settlement[i].debt != 0:
            break
    else:
        bill.status = 'SETTLED'
        bill.save()

    data = {
        'message' : 'Payment Successful'
    }
    json_data = json.dumps(data)
    return json_data


# return json_data for add_groups
def add_new_group(request):
    try:
        grp_name = request.POST.get('group_name')
        mem_list = request.POST.get('member_ids')
        mem_list = list(map(int, json.loads(mem_list)))
        # 4
        # [1,2,3,4]
        # print(request.user.id)
        # mem_list.append(request.user.id)

        # t = Group_Membership.objects.filter(user_id__in=mem_list).exists()
        # print(t)

        # check if group with this members already exists or not 

        # my_groups = Group_Membership.objects.filter(user_id=request.user).values_list('group_id', flat=True)
        # 2 -> 43 45 46
        # 1 -> 43 45
        # 5 -> 43 46 

        # temp_members = mem_list + [request.user.id]
        # print('temp_members', temp_members)
        # print('my_groups', my_groups)
        # for m_grp in my_groups:
            # print(m_grp)
            # g = Group_Membership.objects.filter(group_id_id=m_grp).values_list('user_id', flat=True)
            # if sorted(list(g)) == sorted(temp_members):
                # grp already exists 
                # data = {
                #     'message' : 'Group already exists.',
                #     'status': 'Failed'
                # }
                # json_data = json.dumps(data)
                # break
        # else:
        grp = Group(group_name=grp_name, status='ACTIVE', date=datetime.now())
        grp.save()
        my_gm = Group_Membership(user_id_id=request.user.id, group_id=grp)
        my_gm.save()
        
        # bulk_gms = [Group_Membership(user_id_id=id, group_id=grp) for id in mem_list]
        # bulk_gms.append(Group_Membership(user_id_id=request.user.id, group_id=grp))
        # Group_Membership.objects.bulk_create(bulk_gms)
        
        notifications = [Activity(user_id_id=m_id, sender_id=request.user, group_id=grp, message_type='GROUP_INVITE', message='ACCEPT AND JOIN GROUP.', status='PENDING', date=datetime.now()) for m_id in mem_list]
        Activity.objects.bulk_create(notifications)

        data = {
            'message' : 'Group Invite sent.',
            'status': 'Success'
        }
        json_data = json.dumps(data)

    except IntegrityError as e:
        data = {
            'message' : 'Group Invite failed due to ' + str(e),
            'status': 'Failed'
        }
        json_data = json.dumps(data)

    return json_data

# hold till add expense done 
def get_grp_details(request):

    grp_id = int(request.POST.get('group_id'))

    grp_members = Group_Membership.objects.select_related('user_id', 'group_id').filter(group_id_id=grp_id).values_list('user_id__id', 'user_id__username', 'group_id_id', 'group_id__group_name')
    print(grp_members)

    print(grp_id)
    grp_settlements = Settlement.objects.select_related('user_id', 'group_id', 'bill_id').filter(user_id=request.user, group_id_id=grp_id).values('user_id__id', 'user_id__username', 'group_id_id', 'group_id__group_name', 'bill_id__id', 'bill_id__bill_name', 'bill_id__amount', 'bill_id__split_type', 'bill_id__date', 'bill_id__status', 'paid', 'must_pay', 'debt', 'bill_id__amount')    



    data = {
        'message' : 'testing '
    }
    json_data = json.dumps(data)

    return json_data

def add_group_expense(request):

    group_id = int(request.POST.get('group_id'))
    expense_name = request.POST.get('expense_name')
    total_amount = int(request.POST.get('total_amount'))
    member_payed_amount_dic = json.loads(request.POST.get('member_payed_amount_dic'))
    member_must_pay_amount_dic = json.loads(request.POST.get('member_must_pay_amount_dic'))
    split_type = request.POST.get('split_type')
    dt = request.POST.get('datetime')
    message = request.POST.get('message')
    
    print(group_id, expense_name, total_amount, member_payed_amount_dic, member_must_pay_amount_dic, split_type, dt, message)

    members = member_payed_amount_dic.keys()

    try:
        d = datetime.strptime(dt, '%Y-%m-%dT%H:%M')

        bill_status = 'PENDING'
        if not members:
            bill_status = 'SETTLED'
        b = Bill(bill_name=expense_name, group_id_id=group_id, status=bill_status, date=d, amount=total_amount, split_type=split_type)
        b.save()
        
        act_bulk = [Activity(user_id_id=int(mem), sender_id=request.user, group_id_id=group_id, bill_id=b, message_type='EXPENSE', message=message, status='PENDING', date=datetime.now()) for mem in members if int(mem) != request.user.id]
        Activity.objects.bulk_create(act_bulk)

        if split_type == 'percentage':
            remains = 0
            for mem_id in member_must_pay_amount_dic:
                amount = total_amount*(member_must_pay_amount_dic[mem_id]/100)
                member_must_pay_amount_dic[mem_id] = int(amount)
                remains += amount-int(amount)
                
            for mem_id in member_must_pay_amount_dic:
                if remains == 0:
                    break
                if member_must_pay_amount_dic[mem_id] != 0:
                    member_must_pay_amount_dic[mem_id] += 1
                    remains -= 1
                
                
        settles =[]
        for member in members:
            paid, debt = get_paid_debts(member_payed_amount_dic[member], member_must_pay_amount_dic[member])
            s = Settlement(user_id_id=int(member), bill_id=b, group_id_id=group_id, paid=paid, must_pay=member_must_pay_amount_dic[member], debt=debt)
            settles.append(s)
        Settlement.objects.bulk_create(settles)
   
        data = {
            'message' : 'Sent Expense'
        }
        json_data = json.dumps(data) 
    except IntegrityError as e:
        data = {
            'message' : 'Sent Expense Failed - ' + str(e)
        }
        json_data = json.dumps(data)

    return json_data

def accept_reject_group_invite(request):
    group_id = request.POST.get('group_id')
    state = request.POST.get('state')

    print(group_id)
    print(state)
    if state == 'Accept':
        try:
            current_activity = Activity.objects.get(group_id_id=int(group_id), user_id=request.user, message_type='GROUP_INVITE')
            current_activity.status = 'ACCEPTED'
            current_activity.save()

            my_gm = Group_Membership(user_id_id=request.user.id, group_id_id=int(group_id))
            my_gm.save()

        except IntegrityError as e:
            data = {
                'message' : 'Accept Group invite Failed - ' + str(e)
            }
            json_data = json.dumps(data)
            return json_data
    else:
        pass
        try:
            current_activity = Activity.objects.get(group_id_id=int(group_id), user_id=request.user, message_type='GROUP_INVITE')
            current_activity.status = 'REJECTED'
            current_activity.save()
        except IntegrityError as e:
            data = {
                'message' : 'Reject request Failed - '+str(e)
            }
            json_data = json.dumps(data)
            return json_data

    data = {
        'message' : state + 'ed Done.'
    }
    json_data = json.dumps(data)

    return json_data



# Create your views here.
def home(request):
    if request.user.is_authenticated:
        return redirect('dashboard')


    return render(request, 'home/home.html')

def sign_up_handler(request):
    if request.method == 'POST':
        name = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        cpassword = request.POST.get('confirmPassword')
        phone = request.POST.get('phone')
        try:
            user = CustomUser.objects.create_user(name, email, password)
            user.phone = phone
            user.save()
            data = {
                'message' : 'success'
            }
        except IntegrityError as e:
            data = {
                'message' : 'failed'
            }

        json_data = json.dumps(data)
        return HttpResponse(json_data, content_type="application/json")
    return HttpResponse('404 page not found')

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def login_handler(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['userpassword']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            data = {
                'message' : 'success'
            }
        else:
            data = {
                'message' : 'fail'
            }
        
        
        json_data = json.dumps(data)
        return HttpResponse(json_data, content_type="application/json")


    return HttpResponse('404 page not found')

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def logout_handler(request):
    logout(request)
    return redirect('home')

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def dashboard(request):
    if not request.user.is_authenticated:
        return redirect('home')


    # All Friends List 
    friends_list = []

    all_friends1 = Friend.objects.filter(friend1=request.user, status='ACTIVE')
    for i in all_friends1:
        friends_list.append(i.friend2)

    all_friends2 = Friend.objects.filter(friend2=request.user, status='ACTIVE')
    for i in all_friends2:
        friends_list.append(i.friend1)

    # All Groups List 
    groups_list = my_groups = Group_Membership.objects.select_related('group_id').filter(user_id=request.user, group_id__status='ACTIVE').values_list('group_id_id', 'group_id__group_name')
    groups_list = list(groups_list)

    # friends_list = []
    # groups_list = []
    all_expenses_list = []
    debts_list = []
    recent_activity = []

    context = {
        'friends_list': friends_list,
        'groups_list': groups_list,
        'all_expenses_list': all_expenses_list,
        'debts_list': debts_list,
        'recent_activity': recent_activity
    }
    return render(request, 'home/dashboard.html', context)
    

def add_friend(request):
    if not request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST' and request.POST.get('request_motive') == 'send_friend_request':
        # to invite friend
        json_data = invite_friend(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_friend_request':
        # to accept or reject friend request
        json_data = accept_reject_friend_request(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'add_expense':
        json_data = add_expense(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'get_bills_of_my_friend':
        json_data = get_bills_of_my_friend(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'get_settlements_data':
        json_data = get_settlements_data(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_bill_validation':
        json_data = accept_reject_bill_validation(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'settle_payment':
        json_data = settle_payment(request)
        return HttpResponse(json_data, content_type="application/json")


    # taking all users which is not in friend with current user.
    # this users list doesnt contain users to which friend request is sent
    # also users from which friend request is received.
    # in short users which dont have any friend relation with current user is taken in users dict.
     
    users_qs = CustomUser.objects.all()
    frd = Friend.objects.filter(Q(friend1=request.user) | Q(friend2=request.user)).values_list('friend1', 'friend2')
    lis = []
    for i in frd:
        lis.extend(i)

    users = {}
    for user in users_qs:
        if user.id not in lis and user != request.user:
            users[user.id] = user.username

    # taking all friend requests and invites
    # for requests
    friend_requests = Activity.objects.filter(user_id=request.user, message_type='INVITE', status='PENDING', bill_id=None)
    # print(friend_requests)

    # for invites
    pending_invites = Activity.objects.filter(sender_id=request.user, message_type='INVITE', status='PENDING', bill_id=None)
    
    # current friends
    all_friends = []

    all_friends1 = Friend.objects.filter(friend1=request.user, status='ACTIVE')
    for i in all_friends1:
        all_friends.append(i.friend2)

    all_friends2 = Friend.objects.filter(friend2=request.user, status='ACTIVE')
    for i in all_friends2:
        all_friends.append(i.friend1)


    # all_bill_verifications
    bills_requests = Activity.objects.select_related('bill_id').filter(user_id=request.user, message_type='EXPENSE', status='PENDING')


    context = {
        'users': users,
        'friend_requests': friend_requests,
        'pending_invites': pending_invites,
        'all_friends': all_friends,
        'bills_requests': bills_requests,
        }
    return render(request, 'home/add_friend.html', context)

def add_group(request):
    if not request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST' and request.POST.get('request_motive') == 'add_new_group':
        json_data = add_new_group(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'get_grp_details':
        json_data = get_grp_details(request)
        return HttpResponse(json_data, content_type="application/json")
        
    if request.method == 'POST' and request.POST.get('request_motive') == 'add_group_expense':
        json_data = add_group_expense(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_group_invite':
        json_data = accept_reject_group_invite(request)
        return HttpResponse(json_data, content_type="application/json")
    
    
    # current friends
    all_friends = []

    all_friends1 = Friend.objects.filter(friend1=request.user, status='ACTIVE')
    for i in all_friends1:
        all_friends.append(i.friend2)

    all_friends2 = Friend.objects.filter(friend2=request.user, status='ACTIVE')
    for i in all_friends2:
        all_friends.append(i.friend1)

    # current groups 
    my_groups = Group_Membership.objects.select_related('group_id').filter(user_id=request.user, group_id__status='ACTIVE').values_list('group_id_id', 'group_id__group_name')

    groups_members = {gid:list(Group_Membership.objects.filter(group_id=gid).values_list('user_id', 'user_id__username')) for gid, g_name in my_groups}

    # group_invites
    group_invites = Activity.objects.filter(user_id_id=request.user.id, message_type='GROUP_INVITE', status='PENDING')
    # print(group_invites)



    context = {
        'all_friends': all_friends,
        'my_groups': list(my_groups),
        'groups_members': json.dumps(groups_members),
        'group_invites': group_invites
    }
    return render(request, 'home/add_group.html', context)

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def password_reset_confirm(request, uidb64=None, token=None):
    assert uidb64 is not None and token is not None  # checked by URLconf
    try:
        uid = urlsafe_base64_decode(uidb64)
        user = CustomUser.objects.get(pk=uid)
    except:
        user = None

    if user is not None:
        if request.method == 'POST':
            if default_token_generator.check_token(user, token):
                password1 = request.POST.get('new_password')
                password2 = request.POST.get('new_password_confirm')
                if password1 == password2 and len(password1) != 0:
                    user.set_password(password1)
                    user.save()
                    messages.success(request,
                                    'Password Changed! Login to Continue')
                    return redirect('home')
                else:
                    messages.error(request,
                                    'Both Passwords Must Match. Please try again!'
                                    )
                    return redirect('password_reset_confirm', uidb64=uidb64, token=token)
            else:
                # print('else')
                messages.error(request,
                                'The reset password link is no longer valid. Try again!'
                                )
                return redirect('home')
        elif not default_token_generator.check_token(user, token):
            # print('elif')
            messages.error(request,
                            'The reset password link is no longer valid. Try again!'
                            )
            return redirect('home')
        else:
            # return render(request, 'password_reset_confirm', uidb64=uidb64, token=token)
            return render(request, 'home/confirm_password.html')
    else:
        # print('else')
        messages.error  (request,
                        'The reset password link is no longer valid. Try again!'
                        )
        return redirect('home')

def password_reset_request(request):
    if request.method == "POST":
        password_reset_form = PasswordResetForm(request.POST)
        if password_reset_form.is_valid():
            data = password_reset_form.cleaned_data['email']
            # print(data)
            associated_users = CustomUser.objects.filter(email=data)
            # print(associated_users)
            if associated_users.exists():
                for user in associated_users:
                    subject = "Password Reset Requested"
                    email_template_name = "password_reset_email.txt"
                    c = {
                        "email":user.email,
                        'domain':'127.0.0.1:8000',
                        'site_name': 'Website',
                        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                        "user": user,
                        'token': default_token_generator.make_token(user),
                        'protocol': 'http',
					}
                    email = render_to_string(email_template_name, c)
                    try:
                        send_mail(subject, email, 'admin@example.com' , [user.email], fail_silently=False)
                        data = {
                            'message' : 'success'
                        }
                    except BadHeaderError:
                        return HttpResponse('Invalid header found.')
                    
                    json_data = json.dumps(data)
                    return HttpResponse(json_data, content_type="application/json")

            else:
                data = {
                    'message' : 'no_user_found'
                }
                json_data = json.dumps(data)
                return HttpResponse(json_data, content_type="application/json")

    return redirect('home')