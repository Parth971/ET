from django.contrib import admin
from django.urls import path
from django.urls import re_path
from home import views

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('sign_up_handler/', views.sign_up_handler, name='sign_up_handler'),
    path('login_handler/', views.login_handler, name='login_handler'),
    path('logout_handler/', views.logout_handler, name='logout_handler'),
    # path('add_friend/', views.add_friend, name='add_friend'),
    # path('add_group/', views.add_group, name='add_group'),
    path('reset/<uidb64>/<token>/', views.password_reset_confirm, name='password_reset_confirm'),
    path("password_reset/", views.password_reset_request, name="password_reset"),
    path('activate/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/',  views.activate, name='activate'),  
    path('', views.home, name='home'),
]
