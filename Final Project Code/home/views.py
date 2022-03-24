from calendar import FRIDAY
from email import message
from django.shortcuts import render, redirect
from django.http import HttpResponse

from home.models import CustomUser, Activity, Group, Group_Membership, Friend, Bill, Settlement
from django.db.models import Q
from django.contrib.auth import logout
from django.contrib.auth import authenticate, login

from django.db.utils import IntegrityError
import re
import json
from datetime import datetime

from django.core import serializers

# helper funtions
def check(email):
    regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    if(re.fullmatch(regex, email)):
        return 1
    return 0

def password_check(passwd):
      
    SpecialSym =['$', '@', '#', '%']
    val = True
      
    if len(passwd) < 6:
        print('length should be at least 6')
        val = False
          
    if len(passwd) > 20:
        print('length should be not be greater than 8')
        val = False
          
    if not any(char.isdigit() for char in passwd):
        print('Password should have at least one numeral')
        val = False
          
    if not any(char.isupper() for char in passwd):
        print('Password should have at least one uppercase letter')
        val = False
          
    if not any(char.islower() for char in passwd):
        print('Password should have at least one lowercase letter')
        val = False
          
    if not any(char in SpecialSym for char in passwd):
        print('Password should have at least one of the symbols $@#')
        val = False
    if val:
        return val

def is_phone_valid(s):
    Pattern = re.compile("(0|91)?[7-9][0-9]{9}")
    return Pattern.match(s)

def get_paid_debts(current_paid_amount, must_pay):
    if current_paid_amount >= must_pay:
        return (current_paid_amount, 0)
    return(current_paid_amount, must_pay-current_paid_amount)

def is_bill_settled(settlements):

    for row in settlements:
        if row.debt != 0:
            return False
    
    return True


# return json_data 
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


    print(friend_id, expense_name, total_amount, current_user_amount, other_user_amount, split_type, datetime, message)

    try:
        
        d = datetime.strptime(dt, '%Y-%m-%dT%H:%M')

        b = Bill(bill_name=expense_name, status='PENDING', date=d, amount=total_amount, split_type=split_type)
        b.save()

        friend = CustomUser.objects.get(id=friend_id)

        friend_row = Friend.objects.filter(Q(friend1=friend, friend2=request.user) | Q(friend1=request.user, friend2=friend))[0]
        grp = friend_row.group_id

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


# Create your views here.

def sign_up(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    errors = {
            'name': False,
            'email': False,
            'password': False,
            'password_match': False,
            'phone': False,
        }
    return render(request, 'home/sign_up.html', errors)

def log_in(request):
    errors = {
        'invalid_credentials': False
    }
    return render(request, 'home/login.html', errors)

def sign_up_handler(request):
    if request.method == 'POST':
        name = request.POST.get('username')
        email = request.POST.get('useremail')
        password = request.POST.get('password')
        cpassword = request.POST.get('cpassword')
        phone = request.POST.get('phone')

        errors = {
            'name': False,
            'email': False,
            'password': False,
            'password_match': False,
            'phone': False,
        }
        if len(name) < 3 or not name.isalpha():
            errors['name'] = True
            # errors.append('name should be more than 2 character long and only alphabets are allowed.')

        is_error = False
        if not check(email):
            errors['email'] = True
            is_error = True

        if not password_check(password):
            errors['password'] = True
            is_error = True

        if password != cpassword:
            errors['password_match'] = True
            is_error = True

        if not is_phone_valid(phone):
            errors['phone'] = True
            is_error = True        

        if is_error:
            return render(request, 'home/sign_up.html', errors)
        else:
            try:
                user = CustomUser.objects.create_user(name, email, password)


                user.phone = phone
                user.save()
                return redirect('sign_up')
            except IntegrityError as e:
                print(e)
                return HttpResponse('User already present, cant create this user!!') 
    return HttpResponse('404 page not found')

def login_handler(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('sign_up')
        else:
            errors = {
                'invalid_credentials': True
            }
            return render(request, 'home/login.html', errors)


    return HttpResponse('404 page not found')

def logout_handler(request):
    logout(request)
    return redirect('sign_up')

def dashboard(request):
    return render(request, 'home/dashboard.html')

def add_friend(request):
    
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
    return HttpResponse('add_group')


