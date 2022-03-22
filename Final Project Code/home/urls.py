from django.contrib import admin
from django.urls import path

from home import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('sign_up_handler/', views.sign_up_handler, name='sign_up_handler'),
    path('login_handler/', views.login_handler, name='login_handler'),
    path('logout_handler/', views.logout_handler, name='logout_handler'),
    path('log_in/', views.log_in, name='log_in'),
    path('add_friend/', views.add_friend, name='add_friend'),
    path('add_group/', views.add_group, name='add_group'),
    path('', views.sign_up, name='sign_up'),
]