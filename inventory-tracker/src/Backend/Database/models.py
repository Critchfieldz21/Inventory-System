from django.db import models

class Item(models.Model):
    TYPE_CHOICES = [('material', 'Material'), ('product', 'Product')]
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_quantity = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Recipe(models.Model):
    product_item = models.OneToOneField(Item, on_delete=models.CASCADE, related_name='recipe')
    created_at = models.DateTimeField(auto_now_add=True)

class RecipeComponent(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='components')
    material_item = models.ForeignKey(Item, on_delete=models.RESTRICT, related_name='used_in')
    quantity_needed = models.IntegerField(default=1)

class Transaction(models.Model):
    TYPE_CHOICES = [
        ('sale', 'Sale'), ('purchase', 'Purchase'),
        ('assembly', 'Assembly'), ('loss', 'Loss'), ('adjustment', 'Adjustment')
    ]
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantity_delta = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
