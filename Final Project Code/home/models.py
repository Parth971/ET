from django.db import models


from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=10, default='-')

    def __str__(self):
    	return self.username

class Group(models.Model):
    group_name = models.CharField(max_length=20, default='group-name')
    status = models.CharField(max_length=20, default='PENDING')
    date = models.DateTimeField()

class Group_Membership(models.Model):
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE)

class Bill(models.Model):
    bill_name = models.CharField(max_length=20, default='bill-name')
    amount = models.IntegerField()
    split_type = models.CharField(max_length=20, default='EQUAL')
    date = models.DateTimeField()
    status = models.CharField(max_length=20, default='PENDING')

class Settlement(models.Model):
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    bill_id = models.ForeignKey(Bill, on_delete=models.CASCADE)
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE)
    paid = models.IntegerField()
    debt = models.IntegerField()

class Activity(models.Model):
    user_id = models.ForeignKey(CustomUser, related_name='CurrentUser', on_delete=models.CASCADE)
    sender_id = models.ForeignKey(CustomUser, related_name='SenderUser', on_delete=models.CASCADE)
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE)
    bill_id = models.ForeignKey(Bill, on_delete=models.CASCADE, blank=True, null=True)
    message_type = models.CharField(max_length=20, default='-')
    message = models.CharField(max_length=100, default='-')
    status = models.CharField(max_length=20, default='PENDING')
    date = models.DateTimeField()