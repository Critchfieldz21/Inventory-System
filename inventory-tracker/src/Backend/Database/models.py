from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Item(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    stock = models.IntegerField(default=0)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.cost_price >= self.price:
            raise ValidationError('Cost price must be less than selling price.')


class Recipe(models.Model):
    name = models.CharField(max_length=255)
    ingredients = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Sales(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Completed', 'Completed')]

    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    name = models.CharField(max_length=255, null=True, blank=True)  # Custom name for recipe sales
    quantity = models.IntegerField(default=1)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Completed')
    date = models.DateTimeField(default=None, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.name or self.item.name} - {self.total}"


# Signal to deduct stock when a sale is created
@receiver(post_save, sender=Sales)
def deduct_stock_on_sale(sender, instance, created, **kwargs):
    """Automatically deduct stock from item when a sale is created"""
    if created:
        item = instance.item
        item.stock -= instance.quantity
        if item.stock < 0:
            item.stock = 0
        item.save()
