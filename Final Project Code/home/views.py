from django.shortcuts import render, redirect
from django.http import HttpResponse

from home.models import CustomUser, Activity, Group, Group_Membership
from django.contrib.auth import logout
from django.contrib.auth import authenticate, login

from django.db.utils import IntegrityError
import sqlite3
import re
import json
import datetime

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
    if request.method == 'POST':
        
        user_id = request.POST.get('friend_id')

        friend_user = CustomUser.objects.get(id=user_id)
        current_user = request.user

        try:
            group = Group(group_name='Friends', status='PENDING', date=datetime.datetime.now() )
            group.save()

            gm1 = Group_Membership(user_id=current_user, group_id=group)
            gm2 = Group_Membership(user_id=friend_user, group_id=group)

            gm1.save()
            gm2.save()

            activity = Activity(user_id=friend_user, sender_id=current_user, group_id=group, message_type='INVITE',  message='lets join in!!!', status='PENDING', date=datetime.datetime.now() )

            activity.save()

            data = {
                'message' : 'Sent invite'
            }
            json_data = json.dumps(data)
            return HttpResponse(json_data, content_type="application/json")
        except IntegrityError as e:
            data = {
                'message' : 'Sent invite Failed'+str(e)
            }
            json_data = json.dumps(data)
            return HttpResponse(json_data, content_type="application/json")
        


    users_qs = CustomUser.objects.all().exclude(username='admin')

    users = {}
    for i in users_qs:
        users[i.id] = i.username


    context = {'users': users}
    return render(request, 'home/add_friend.html', context)




def add_group(request):
    return HttpResponse('add_group')




