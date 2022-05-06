from django.shortcuts import render, redirect
from django.http import HttpResponse

from home.models import CustomUser, Activity, Group, Group_Membership, Friend, Bill, Settlement
from django.db.models import Q
from django.db.models import F

from django.contrib.auth import logout
from django.contrib.auth import authenticate, login

from django.db.utils import IntegrityError
import json
from datetime import datetime
from functools import reduce

from django.contrib import messages
from django.views.decorators.cache import cache_control

from django.core.mail import send_mail, BadHeaderError, EmailMessage
from django.contrib.auth.forms import PasswordResetForm
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str

from django.contrib.sites.shortcuts import get_current_site 
from .token import account_activation_token


# Helper funtions
def get_paid_debts(current_paid_amount, must_pay):
    if current_paid_amount >= must_pay:
        return (current_paid_amount, 0)
    return(current_paid_amount, must_pay-current_paid_amount)

def is_bill_settled(settlements):

    for row in settlements:
        if row.debt != 0:
            return False
    
    return True

# Dashboard views
def invite_friend(request):
    friend_id = int(request.POST.get('friend_id'))

    try:
        if Friend.objects.filter(user_id_id=friend_id, friend_id_id=request.user.id).exists():
            data = {
                'message' : 'Already your Friend Invited you.',
                'status': 'failed'
            }
        else:
            friend, created = Friend.objects.get_or_create(user_id_id=request.user.id, friend_id_id=friend_id, group_id=None, status='PENDING')

            if created:
                Activity.objects.create(user_id_id=friend_id, sender_id_id=request.user.id, group_id=None, bill_id=None, message_type='FRIEND_REQUEST', message='HURRY!! ACCEPT MY FRIEND REQUEST', status='PENDING', date=datetime.now())

                data = {
                    'message' : 'Friend request sent.',
                    'status': 'success'
                }
            else:
                data = {
                    'message' : 'Friend request was already sent.',
                    'status': 'failed'
                }
    except IntegrityError as e:
        data = {
            'message' : 'Friend request failed due to ' + str(e),
            'status': 'error'          
        }

    json_data = json.dumps(data)
    return json_data

def accept_reject_friend_request(request):
    activity_id = int(request.POST.get('activity_id'))
    status = request.POST.get('status')
    sender_id = int(request.POST.get('sender_id'))

    # print(activity_id)
    # print(status)
    # print(sender_id)

    # check if they are already friend 
    if Friend.objects.filter(user_id_id=sender_id, friend_id_id=request.user.id, status='ACTIVE').exists():
        current_activity = Activity.objects.get(id=activity_id)
        current_activity.status = 'ACTIVE'
        current_activity.save()

        data = {
            'message' : 'THEY ARE ALREADY FRIENDS',
            'status': 'failed'
        }
    else:
        try:
            if status == 'Accept':
                FRIEND_GROUP = Group.objects.create(group_name='FRIEND', status='ACTIVE', date=datetime.now())
                FRIEND_GROUP.save()

                sender_row = Friend.objects.get(user_id_id=sender_id, friend_id_id=request.user.id)
                sender_row.status = 'ACTIVE'
                sender_row.group_id = FRIEND_GROUP
                sender_row.save()

                current_activity = Activity.objects.get(id=activity_id)
                current_activity.status='ACTIVE'
                current_activity.save()

                my_row = Friend.objects.create(user_id_id=request.user.id, friend_id_id=sender_id, status='ACTIVE', group_id=FRIEND_GROUP)
                my_row.save()

                data = {
                    'message' : 'Accepted.',
                    'status': 'success'
                }
            else:
                current_activity = Activity.objects.get(id=activity_id)
                current_activity.status='REJECTED'
                current_activity.save()

                sender_row = Friend.objects.filter(user_id_id=sender_id, friend_id_id=request.user.id)
                sender_row.delete()

                data = {
                    'message' : 'Rejected',
                    'status': 'success'
                }

        except IntegrityError as e:
            data = {
                'message' : 'Request Failed due to ' + str(e),
                'status': 'error'
            }
        
    json_data = json.dumps(data)
    return json_data

def add_new_group(request):
    try:
        grp_name = request.POST.get('group_name')
        mem_list = request.POST.get('member_ids')
        mem_list = list(map(int, json.loads(mem_list)))
        
        grp = Group(group_name=grp_name, status='ACTIVE', date=datetime.now())
        grp.save()
        my_gm = Group_Membership(user_id_id=request.user.id, group_id=grp)
        my_gm.save()
        
        
        notifications = [Activity(user_id_id=m_id, sender_id=request.user, group_id=grp, message_type='GROUP_INVITE', message='ACCEPT AND JOIN GROUP.', status='PENDING', date=datetime.now()) for m_id in mem_list if m_id != request.user.id]
        
        Activity.objects.bulk_create(notifications)

        data = {
            'message' : 'Group Invite sent.',
            'status': 'success'
        }

    except IntegrityError as e:
        data = {
            'message' : 'Group invite failed due to ' + str(e),
            'status': 'failed'
        }

    json_data = json.dumps(data)
    return json_data

def accept_reject_group_request(request):
    activity_id = int(request.POST.get('activity_id'))
    status = request.POST.get('status')
    group_id = int(request.POST.get('group_id'))

    # check if they are already in group 
    if Group_Membership.objects.filter(user_id_id=request.user.id, group_id_id=group_id).exists():
        current_activity = Activity.objects.get(id=activity_id)
        current_activity.status = 'ACCEPTED'
        current_activity.save()

        data = {
            'message' : 'You are already in group.',
            'status': 'failed'
        }
    elif Activity.objects.filter(id=activity_id)[0].status != 'PENDING':
        data = {
            'message' : 'Action already taken.',
            'status': 'failed'
        }
    else:
        try:
            if status == 'Accept':
                gm = Group_Membership.objects.create(user_id_id=request.user.id, group_id_id=group_id)
                gm.save()

                current_activity = Activity.objects.get(id=activity_id)
                current_activity.status='ACCEPTED'
                current_activity.save()

                data = {
                    'message' : 'Accepted.',
                    'status': 'success'
                }
            else:
                current_activity = Activity.objects.get(id=activity_id)
                current_activity.status='REJECTED'
                current_activity.save()

                data = {
                    'message' : 'Rejected',
                    'status': 'success'
                }

        except IntegrityError as e:
            data = {
                'message' : 'Request Failed due to ' + str(e),
                'status': 'error'
            }
        
    json_data = json.dumps(data)
    return json_data

def add_friend_expense(request):
    friend_id = int(request.POST.get('friend_id'))
    friend_expense_name = request.POST.get('friend_expense_name')
    total_amount = int(request.POST.get('total_amount'))
    member_payed_amount_dic = json.loads(request.POST.get('member_payed_amount_dic'))
    member_must_pay_amount_dic = json.loads(request.POST.get('member_must_pay_amount_dic'))
    split_type = request.POST.get('split_type')
    dt = request.POST.get('datetime')
    message = request.POST.get('message')
    
    # print(friend_id, friend_expense_name, total_amount, member_payed_amount_dic, member_must_pay_amount_dic, split_type, dt, message)

    try:
        # check if they are friends
        friend_row = Friend.objects.filter(user_id_id=request.user.id, friend_id_id=friend_id, status='ACTIVE')
        if friend_row.exists():
            d = datetime.strptime(dt, '%Y-%m-%dT%H:%M')
            group_id = friend_row.first().group_id

            bill = Bill(bill_name=friend_expense_name, group_id=group_id, status='PENDING', date=d, amount=total_amount, split_type=split_type)
            bill.save()

            notification = Activity(user_id_id=friend_id, sender_id_id=request.user.id, group_id=group_id, bill_id=bill, message_type='EXPENSE', message=message, status='PENDING', date=datetime.now() )
            notification.save()

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
                
            members = member_payed_amount_dic.keys()
            settles =[]
            for member in members:
                paid, debt = get_paid_debts(member_payed_amount_dic[member], member_must_pay_amount_dic[member])
                s = Settlement(user_id_id=int(member), bill_id=bill, group_id=group_id, paid=paid, must_pay=member_must_pay_amount_dic[member], debt=debt)
                settles.append(s)
            Settlement.objects.bulk_create(settles)

            data = {
                'message' : 'Expense sent to your friend for verification.',
                'status': 'success'
            }

        else:
            data = {
                'message' : 'He\'s not your friend yet',
                'status': 'failed'
            }
    except IntegrityError as e:
        data = {
            'message' : 'Expense sending failed due to ' + str(e),
            'status': 'failed'
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
    
    # print(group_id, expense_name, total_amount, member_payed_amount_dic, member_must_pay_amount_dic, split_type, dt, message)

    members = member_payed_amount_dic.keys()

    try:
        d = datetime.strptime(dt, '%Y-%m-%dT%H:%M')

        bill_status = 'PENDING'
        if len(members) == 1:
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
            'message' : 'Expense sent to your group members for verification.',
            'status': 'success'
        }
    except IntegrityError as e:
        data = {
            'message' : 'Expense sending failed due to ' + str(e),
            'status': 'failed'
        }
        
    json_data = json.dumps(data)
    return json_data

def accept_reject_group_expense_request(request):
    activity_id = int(request.POST.get('activity_id'))
    group_id = int(request.POST.get('group_id'))
    bill_id = int(request.POST.get('bill_id'))
    status = request.POST.get('status')

    # print(activity_id, group_id, bill_id)
    
    if Bill.objects.filter(id=bill_id, status='REJECTED').exists():
        current_activity = Activity.objects.get(id=activity_id)
        current_activity.status = 'REJECTED'
        current_activity.save()
        data = {
            'message' : 'Expense already rejected by other members',
            'status': 'failed'
        }
    else:
        try:
            if status == 'Accept':
                current_activity = Activity.objects.get(id=activity_id)
                current_activity.status = 'ACCEPTED'
                current_activity.save()

                # check if all have accepted expense or not
                status_of_bill = Activity.objects.filter(group_id_id=group_id, bill_id_id=bill_id).values_list('status', flat=True)
                if len(set(status_of_bill)) == 1 and status_of_bill[0] == 'ACCEPTED':
                    bill = Bill.objects.get(id=bill_id)
                    settlements = Settlement.objects.filter(bill_id=bill)
                    
                    if is_bill_settled(settlements):
                        bill.status = 'SETTLED'
                    else:
                        bill.status = 'UNSETTLED'
                    bill.save()

                data = {
                    'message' : 'Expense accepted',
                    'status': 'success'
                }
            else:
                current_activity = Activity.objects.get(id=activity_id)
                current_activity.status = 'REJECTED'
                current_activity.save()


                bill = Bill.objects.get(id=bill_id)
                bill.status = 'REJECTED'
                bill.save()

                data = {
                    'message' : 'Expense rejected',
                    'status': 'success'
                }
        except IntegrityError as e:
            data = {
                'message' : 'Expense ' + status + 'tion ' + 'failed due to ' + str(e),
                'status': 'failed'
            }
        
    json_data = json.dumps(data)
    return json_data

def accept_reject_friend_expense_request(request):
    activity_id = int(request.POST.get('activity_id'))
    group_id = int(request.POST.get('group_id'))
    bill_id = int(request.POST.get('bill_id'))
    status = request.POST.get('status')

    # print(activity_id, group_id, bill_id)

    try:
        if status == 'Accept':
            current_activity = Activity.objects.get(id=activity_id)
            current_activity.status = 'ACCEPTED'
            current_activity.save()

            bill = Bill.objects.get(id=bill_id)
            settlements = Settlement.objects.filter(bill_id=bill)
            
            if is_bill_settled(settlements):
                bill.status = 'SETTLED'
            else:
                bill.status = 'UNSETTLED'
            bill.save()

            data = {
                'message' : 'Expense accepted',
                'status': 'success'
            }
        else:
            current_activity = Activity.objects.get(id=activity_id)
            current_activity.status = 'REJECTED'
            current_activity.save()


            bill = Bill.objects.get(id=bill_id)
            bill.status = 'REJECTED'
            bill.save()

            data = {
                'message' : 'Expense rejected',
                'status': 'success'
            }
    except IntegrityError as e:
        data = {
            'message' : 'Expense ' + status + 'tion ' + 'failed due to ' + str(e),
            'status': 'failed'
        }
        
        
    json_data = json.dumps(data)
    return json_data

def get_friend(request):
    friend_user_id = int(request.POST.get('friend_user_id'))

    friend = CustomUser.objects.get(id=friend_user_id)

    group_id = Friend.objects.get(user_id_id=request.user.id, friend_id_id=friend_user_id)
    # print(group_id.group_id)


    current_group = group_id.group_id

    group_members_name = Friend.objects.select_related('user_id').filter(group_id=current_group).values_list('user_id__username')

    # bills = Bill.objects.filter(group_id=current_group).values()

    # settlements = [list(Settlement.objects.filter(user_id=request.user, group_id=current_group, bill_id=bill['id']).values('user_id_id', 'user_id__username', 'bill_id_id', 'paid', 'debt', 'must_pay')) for bill in bills]

    settlements = Settlement.objects.select_related('bill_id').filter(user_id=request.user, group_id=current_group).values('user_id_id', 'user_id__username', 'bill_id_id', 'paid', 'debt', 'must_pay', 'bill_id__bill_name', 'bill_id__amount', 'bill_id__split_type', 'bill_id__date', 'bill_id__status')


    # zipped_bill_settlements = []
    # if bills:
        # zipped_bill_settlements = zip(bills, settlements)

    def myconverter(o):
        if isinstance(o, datetime):
            return o.__str__()

    result = {}
    result['status'] = 'success'
    result['message'] = 'Group details fetched'
    result['friend_user_id'] = friend_user_id
    result['friend_name'] = friend.username
    result['group_status'] = current_group.status
    result['group_date'] = current_group.date
    # result['zipped_bill_settlements'] = list(zipped_bill_settlements)
    result['total_members'] = len(group_members_name)
    result['group_members_name'] = list(group_members_name)
    result['settlements'] = list(settlements)

    # print(result)
    # result = {}

    json_data = json.dumps(result, default = myconverter)
    return json_data

def get_group(request):
    group_id = int(request.POST.get('group_id'))
    # print(group_id)


    current_group = Group.objects.get(id=group_id)

    group_members_name = Group_Membership.objects.select_related('user_id').filter(group_id=current_group).values_list('user_id__username')

    # bills = Bill.objects.filter(group_id=current_group).values()

    # settlements = [list(Settlement.objects.filter(user_id=request.user, group_id=current_group, bill_id=bill['id']).values('user_id_id', 'user_id__username', 'bill_id_id', 'paid', 'debt', 'must_pay')) for bill in bills]


    settlements = Settlement.objects.select_related('bill_id').filter(user_id=request.user, group_id=current_group).values('user_id_id', 'user_id__username', 'bill_id_id', 'paid', 'debt', 'must_pay', 'bill_id__bill_name', 'bill_id__amount', 'bill_id__split_type', 'bill_id__date', 'bill_id__status')

    # payers_list = Settlement.objects.select_related('user_id').filter(user_id__username__in=group_members_name, paid__gt=F('must_pay'), group_id=current_group).values('user_id_id', 'user_id__username')

    

    
    payers_list = [list(Settlement.objects.select_related('user_id').filter(paid__gt=F('must_pay'), group_id=current_group, bill_id_id=s['bill_id_id']).values('user_id_id', 'user_id__username')) for s in settlements]

    # print(payers_list)
    # print(settlements)

    # zipped_bill_settlements = []
    # if bills:
    #     zipped_bill_settlements = zip(bills, settlements)

    def myconverter(o):
        if isinstance(o, datetime):
            return o.__str__()

    # print(list(zipped_bill_settlements))

    result = {}
    result['status'] = 'success'
    result['message'] = 'Group details fetched'
    result['group_id'] = group_id
    result['group_name'] = current_group.group_name
    result['group_status'] = current_group.status
    result['group_date'] = current_group.date
    # result['zipped_bill_settlements'] = list(zipped_bill_settlements)
    result['total_members'] = len(group_members_name)
    result['group_members_name'] = list(group_members_name)
    result['settlements'] = list(settlements)
    result['payers_list'] = list(payers_list)

    # print(list(settlements))
    # print(result)


    json_data = json.dumps(result, default = myconverter)
    return json_data

def settle_payment(request):
    bill_id = int(request.POST.get('bill_id'))
    payed_amount = int(request.POST.get('payed_amount'))
    category = request.POST.get('category')
    payer_id = int(request.POST.get('payer_id'))
    print(payer_id)

    # if category == 'F':
    bill = Bill.objects.get(id=bill_id)
    settlement = Settlement.objects.get(user_id=request.user, bill_id=bill)
    payers_settlement = Settlement.objects.get(user_id_id=payer_id, bill_id=bill)

    if payed_amount>0 and payed_amount<=settlement.debt:
        settlement.paid += payed_amount
        settlement.debt -= payed_amount
        settlement.save()

        payers_settlement.paid -= payed_amount
        payers_settlement.save()

        # cheks for bill status 
        settlement = Settlement.objects.filter(bill_id=bill)
        for i in range(len(settlement)):
            if settlement[i].debt != 0:
                break
        else:
            bill.status = 'SETTLED'
            bill.save()

        data = {
            'status': 'success',
            'message' : 'Payment Successful.'
        }
    else:
        data = {
            'status': 'failed',
            'message' : 'Payment failed due to invalid value'
        }
    # else:
    #     payer_id = int(request.POST.get('payer_id'))
    #     bill = Bill.objects.get(id=bill_id)
    #     my_settlement = Settlement.objects.get(user_id_id=request.user.id, bill_id=bill)
    #     payers_settlement = Settlement.objects.get(user_id_id=payer_id, bill_id=bill)

    #     if payed_amount>0 and payed_amount<=my_settlement.debt:
    #         my_settlement.paid += payed_amount
    #         my_settlement.debt -= payed_amount
    #         my_settlement.save()

    #         payers_settlement.paid -= payed_amount
    #         payers_settlement.save()

    #         # cheks for bill status 
    #         settlement = Settlement.objects.filter(bill_id=bill)
    #         for i in range(len(settlement)):
    #             if settlement[i].debt != 0:
    #                 break
    #         else:
    #             bill.status = 'SETTLED'
    #             bill.save()

    #         data = {
    #             'status': 'success',
    #             'message' : 'Payment Successful.'
    #         }
    #     else:
    #         data = {
    #             'status': 'failed',
    #             'message' : 'Payment failed due to invalid value'
    #         }




    json_data = json.dumps(data)
    return json_data


# Main views
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
            user.is_active = False
            user.save()

            current_site = get_current_site(request)  
            mail_subject = 'Activation link has been sent to your email id'  
            message = render_to_string('acc_active_email.html', {  
                'user': user,  
                'domain': current_site.domain,  
                'uid':urlsafe_base64_encode(force_bytes(user.pk)),  
                'token':account_activation_token.make_token(user),  
            })  
            email = EmailMessage(  
                        mail_subject, message, to=[email]  
            )  
            email.send()


            data = {
                'message' : 'success'
            }
        except IntegrityError as e:
            print(e)
            data = {
                'message' : 'failed'
            }

        json_data = json.dumps(data)
        return HttpResponse(json_data, content_type="application/json")
    return HttpResponse('404 page not found')

def activate(request, uidb64, token):  
    User = CustomUser()  
    try:  
        uid = force_str(urlsafe_base64_decode(uidb64))  
        user = CustomUser.objects.get(pk=uid)  
    except(TypeError, ValueError, OverflowError, User.DoesNotExist):  
        user = None  
    if user is not None and account_activation_token.check_token(user, token):  
        user.is_active = True  
        user.save()  
        return HttpResponse('Thank you for your email confirmation. Now you can login your account.')  
    else:  
        return HttpResponse('Activation link is invalid!')  


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

    if request.method == 'POST' and request.POST.get('request_motive') == 'invite_friend':
        json_data = invite_friend(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_friend_request':
        json_data = accept_reject_friend_request(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'invite_for_new_group':
        json_data = add_new_group(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_group_request':
        json_data = accept_reject_group_request(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'add_friend_expense':
        json_data = add_friend_expense(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'add_group_expense':
        json_data = add_group_expense(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_group_expense_request':
        json_data = accept_reject_group_expense_request(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_friend_expense_request':
        json_data = accept_reject_friend_expense_request(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'get_group':
        json_data = get_group(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'get_friend':
        json_data = get_friend(request)
        return HttpResponse(json_data, content_type="application/json")

    if request.method == 'POST' and request.POST.get('request_motive') == 'settle_payment':
        json_data = settle_payment(request)
        return HttpResponse(json_data, content_type="application/json")


    # All Groups List 
    groups_list = my_groups = Group_Membership.objects.select_related('group_id').filter(user_id=request.user, group_id__status='ACTIVE').values_list('group_id_id', 'group_id__group_name')
    groups_list = list(groups_list)

    # friend invites
    friend_invites = Activity.objects.select_related('sender_id').filter(user_id_id=request.user.id, message_type='FRIEND_REQUEST', status='PENDING').values('id', 'sender_id', 'sender_id__username')

    # All Users who is not friend
    my_friends = Friend.objects.filter(user_id_id=request.user.id, status='ACTIVE').values('friend_id__id')
    not_friend_users = CustomUser.objects.filter(~Q(id=request.user.id), ~Q(id__in=my_friends)).exclude(is_superuser=True).values('id', 'username')

    # All my friends
    friends_list = Friend.objects.filter(user_id_id=request.user.id, status='ACTIVE').values('friend_id__id', 'friend_id__username')

    # All my groups 
    my_groups = Group_Membership.objects.select_related('group_id').filter(user_id=request.user, group_id__status='ACTIVE').values_list('group_id_id', 'group_id__group_name')

    groups_members = {gid:list(Group_Membership.objects.filter(group_id=gid).values_list('user_id', 'user_id__username')) for gid, g_name in my_groups}

    # group invites
    group_invites = Activity.objects.select_related('group_id').filter(user_id_id=request.user.id, message_type='GROUP_INVITE', status='PENDING').values('id', 'group_id__id', 'group_id__group_name')

    # group expense verification notification
    group_expense_requests = Activity.objects.select_related('group_id', 'bill_id').filter(~Q(group_id__group_name='FRIEND'), user_id_id=request.user.id, message_type='EXPENSE', status='PENDING').values('id','message', 'group_id__id','group_id__group_name', 'bill_id__id', 'date', 'sender_id__username', 'bill_id__bill_name', 'bill_id__amount', 'bill_id__split_type', 'bill_id__date')
    all_settles = [Settlement.objects.filter(user_id_id=request.user.id, group_id=group_expense_requests[index]['group_id__id'], bill_id=group_expense_requests[index]['bill_id__id']).values('paid', 'debt', 'must_pay').first() for index in range(len(group_expense_requests))]

    zipped_group_expense_requests = []
    if group_expense_requests:
        zipped_group_expense_requests = zip(group_expense_requests, all_settles)
    

    # friend expense verification notification
    friend_expense_requests = Activity.objects.select_related('group_id', 'bill_id').filter(group_id__group_name='FRIEND', user_id_id=request.user.id, message_type='EXPENSE', status='PENDING').values('id','message', 'group_id__id','group_id__group_name', 'bill_id__id', 'date', 'sender_id__username', 'bill_id__bill_name', 'bill_id__amount', 'bill_id__split_type', 'bill_id__date')
    all_settles = [Settlement.objects.filter(user_id_id=request.user.id, group_id=friend_expense_requests[index]['group_id__id'], bill_id=friend_expense_requests[index]['bill_id__id']).values('paid', 'debt', 'must_pay').first() for index in range(len(friend_expense_requests))]

    zipped_friend_expense_requests = []
    if friend_expense_requests:
        zipped_friend_expense_requests = zip(friend_expense_requests, all_settles)

    # all my expenses which are unsettled
    # for dashboard 
    unsettled_expenses = Settlement.objects.select_related('bill_id', 'group_id').filter(user_id_id=request.user.id, bill_id__status='UNSETTLED').values('user_id_id', 'user_id__username', 'bill_id_id', 'paid', 'debt', 'must_pay', 'bill_id__bill_name', 'bill_id__amount', 'bill_id__split_type', 'bill_id__date', 'bill_id__status', 'group_id__group_name', 'group_id')

    print(unsettled_expenses)

    def lent_amount(paid, must_pay, debt):
        if debt != 0:
            return 0
        return paid-must_pay

    for i in range(len(unsettled_expenses)):
        unsettled_expenses[i]['lent'] = lent_amount(unsettled_expenses[i]['paid'], unsettled_expenses[i]['must_pay'], unsettled_expenses[i]['debt'])
        if unsettled_expenses[i]['group_id__group_name'] == 'FRIEND':
            grp_id = unsettled_expenses[i]['group_id']
            f = Friend.objects.select_related('user_id').get(~Q(user_id_id=request.user.id), group_id_id=grp_id)
            unsettled_expenses[i]['group_id__group_name'] = f.user_id.username

    unsettled_expenses = [i for i in unsettled_expenses if i['lent'] != 0 or i['debt'] != 0]

    all_expenses_list = []  
    debts_list = []
    recent_activity = []

    # print(unsettled_expenses)
    not_friend_users = list(not_friend_users)
    
    context = {
        'friends_list': friends_list,
        'groups_list': groups_list,
        # 'all_expenses_list': all_expenses_list,
        # 'debts_list': debts_list,
        # 'recent_activity': recent_activity,
        'not_friend_users': not_friend_users,
        'not_friend_users_for_js': json.dumps({i:not_friend_users[i] for i in range(len(not_friend_users))}),
        'friend_invites': friend_invites,
        'groups_members': json.dumps(groups_members),
        'group_invites': group_invites,
        # 'group_expense_requests': group_expense_requests, # this and below 1 is for showing group expense request verification
        # 'all_settles': all_settles
        'zipped_group_expense_requests': zipped_group_expense_requests,
        'zipped_friend_expense_requests': zipped_friend_expense_requests,
        'unsettled_expenses': unsettled_expenses
    }
    return render(request, 'home/dashboard.html', context)
    
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
                        # send_mail(subject, email, 'desaiparth971@gmail.com' , [user.email], fail_silently=False)
                        email = EmailMessage(subject, email, to=[user.email])  
                        email.send()  
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





# def add_friend(request):
#     if not request.user.is_authenticated:
#         return redirect('home')
    
#     # if request.method == 'POST' and request.POST.get('request_motive') == 'send_friend_request':
#     #     # to invite friend
#     #     json_data = invite_friend(request)
#     #     return HttpResponse(json_data, content_type="application/json")

#     # if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_friend_request':
#     #     # to accept or reject friend request
#     #     json_data = accept_reject_friend_request(request)
#     #     return HttpResponse(json_data, content_type="application/json")

#     if request.method == 'POST' and request.POST.get('request_motive') == 'add_expense':
#         json_data = add_expense(request)
#         return HttpResponse(json_data, content_type="application/json")

#     if request.method == 'POST' and request.POST.get('request_motive') == 'get_bills_of_my_friend':
#         json_data = get_bills_of_my_friend(request)
#         return HttpResponse(json_data, content_type="application/json")

#     if request.method == 'POST' and request.POST.get('request_motive') == 'get_settlements_data':
#         json_data = get_settlements_data(request)
#         return HttpResponse(json_data, content_type="application/json")

#     if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_bill_validation':
#         json_data = accept_reject_bill_validation(request)
#         return HttpResponse(json_data, content_type="application/json")

#     if request.method == 'POST' and request.POST.get('request_motive') == 'settle_payment':
#         json_data = settle_payment(request)
#         return HttpResponse(json_data, content_type="application/json")


#     # taking all users which is not in friend with current user.
#     # this users list doesnt contain users to which friend request is sent
#     # also users from which friend request is received.
#     # in short users which dont have any friend relation with current user is taken in users dict.
     
#     users_qs = CustomUser.objects.all()
#     frd = Friend.objects.filter(Q(friend1=request.user) | Q(friend2=request.user)).values_list('friend1', 'friend2')
#     lis = []
#     for i in frd:
#         lis.extend(i)

#     users = {}
#     for user in users_qs:
#         if user.id not in lis and user != request.user:
#             users[user.id] = user.username

#     # taking all friend requests and invites
#     # for requests
#     friend_requests = Activity.objects.filter(user_id=request.user, message_type='INVITE', status='PENDING', bill_id=None)
#     # print(friend_requests)

#     # for invites
#     pending_invites = Activity.objects.filter(sender_id=request.user, message_type='INVITE', status='PENDING', bill_id=None)
    
#     # current friends
#     all_friends = []

#     all_friends1 = Friend.objects.filter(friend1=request.user, status='ACTIVE')
#     for i in all_friends1:
#         all_friends.append(i.friend2)

#     all_friends2 = Friend.objects.filter(friend2=request.user, status='ACTIVE')
#     for i in all_friends2:
#         all_friends.append(i.friend1)


#     # all_bill_verifications
#     bills_requests = Activity.objects.select_related('bill_id').filter(user_id=request.user, message_type='EXPENSE', status='PENDING')


#     context = {
#         'users': users,
#         'friend_requests': friend_requests,
#         'pending_invites': pending_invites,
#         'all_friends': all_friends,
#         'bills_requests': bills_requests,
#         }
#     return render(request, 'home/add_friend.html', context)

# def add_group(request):
#     if not request.user.is_authenticated:
#         return redirect('home')

#     if request.method == 'POST' and request.POST.get('request_motive') == 'add_new_group':
#         json_data = add_new_group(request)
#         return HttpResponse(json_data, content_type="application/json")

#     if request.method == 'POST' and request.POST.get('request_motive') == 'get_grp_details':
#         json_data = get_grp_details(request)
#         return HttpResponse(json_data, content_type="application/json")
        
#     if request.method == 'POST' and request.POST.get('request_motive') == 'add_group_expense':
#         json_data = add_group_expense(request)
#         return HttpResponse(json_data, content_type="application/json")

#     if request.method == 'POST' and request.POST.get('request_motive') == 'accept_reject_group_invite':
#         json_data = accept_reject_group_invite(request)
#         return HttpResponse(json_data, content_type="application/json")
    
    
#     # current friends
#     all_friends = []

#     all_friends1 = Friend.objects.filter(friend1=request.user, status='ACTIVE')
#     for i in all_friends1:
#         all_friends.append(i.friend2)

#     all_friends2 = Friend.objects.filter(friend2=request.user, status='ACTIVE')
#     for i in all_friends2:
#         all_friends.append(i.friend1)

#     # current groups 
#     my_groups = Group_Membership.objects.select_related('group_id').filter(user_id=request.user, group_id__status='ACTIVE').values_list('group_id_id', 'group_id__group_name')

#     groups_members = {gid:list(Group_Membership.objects.filter(group_id=gid).values_list('user_id', 'user_id__username')) for gid, g_name in my_groups}

#     # group_invites
#     group_invites = Activity.objects.filter(user_id_id=request.user.id, message_type='GROUP_INVITE', status='PENDING')
#     # print(group_invites)



#     context = {
#         'all_friends': all_friends,
#         'my_groups': list(my_groups),
#         'groups_members': json.dumps(groups_members),
#         'group_invites': group_invites
#     }
#     return render(request, 'home/add_group.html', context)
