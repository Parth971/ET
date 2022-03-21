from django.shortcuts import render, redirect

# Create your views here.

def sign_up(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'home/sign_up.html')

def dashboard(request):
    return render(request, 'home/dashboard.html')