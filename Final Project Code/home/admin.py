from django.contrib import admin

# Register your models here.

from home.models import CustomUser, Group, Group_Membership, Bill, Settlement, Activity, Friend
admin.site.register([CustomUser, Group, Group_Membership, Bill, Settlement, Activity, Friend])