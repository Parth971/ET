from django.contrib import admin
from django.urls import path

from home import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('', views.sign_up, name='sign_up'),
]
