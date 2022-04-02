from tokenize import group
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

    def __str__(self):
        return str(self.id) + '. ' + str(self.group_name) + ' -> ' + str(self.status)

class Group_Membership(models.Model):
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.id) + '. ' + str(self.user_id) + ' -> ' + str(self.group_id)

class Bill(models.Model):
    bill_name = models.CharField(max_length=20, default='bill-name')
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE, default=None)
    amount = models.IntegerField()
    split_type = models.CharField(max_length=20, default='EQUAL')
    date = models.DateTimeField()
    status = models.CharField(max_length=20, default='PENDING')

    def __str__(self):
        return str(self.id) + ' | ' +  str(self.bill_name) + ' | ' + str(self.amount) + ' | ' + str(self.status) + ' | ' + str(self.group_id)

class Settlement(models.Model):
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    bill_id = models.ForeignKey(Bill, on_delete=models.CASCADE)
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE)
    paid = models.IntegerField()
    must_pay = models.IntegerField(default=0)
    debt = models.IntegerField()

    def __str__(self):
        return str(self.user_id) + ' | ' + str(self.bill_id) + ' | ' + str(self.paid) + ' | ' +  str(self.debt)

class Activity(models.Model):
    user_id = models.ForeignKey(CustomUser, related_name='CurrentUser', on_delete=models.CASCADE)
    sender_id = models.ForeignKey(CustomUser, related_name='SenderUser', on_delete=models.CASCADE)
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True)
    bill_id = models.ForeignKey(Bill, on_delete=models.CASCADE, blank=True, null=True)
    message_type = models.CharField(max_length=20, default='-')
    message = models.CharField(max_length=100, default='-')
    status = models.CharField(max_length=20, default='PENDING')
    date = models.DateTimeField()

    def __str__(self):
        return str(self.id) + '. ' + str(self.sender_id) + ' -> ' + str(self.user_id) + ' | ' + str(self.message_type) + ' | ' + str(self.group_id) + ' | ' + str(self.status)


class Friend(models.Model):
    user_id = models.ForeignKey(CustomUser, related_name='Current' ,on_delete=models.CASCADE, default=None)
    friend_id = models.ForeignKey(CustomUser, related_name='Friend' ,on_delete=models.CASCADE, default=None)
    group_id = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING')

    def __str__(self):
        return str(self.id) + '. ' + str(self.user_id) + ' -> ' + str(self.friend_id) + ' | ' + str(self.status) + ' | ' + str(self.group_id)
