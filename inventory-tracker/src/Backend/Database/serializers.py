from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Item, Recipe, Sales, Expense
import json


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        read_only_fields = ['id']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def create(self, validated_data):
        # create_user hashes password automatically
        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    recovery_code = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'user', 'name', 'category', 'stock', 'cost_price', 'price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    



class RecipeSerializer(serializers.ModelSerializer):
    ingredients_display = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['id', 'user', 'name', 'ingredients', 'ingredients_display', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_ingredients_display(self, obj):
        """Return ingredients in a readable format"""
        try:
            if not obj.ingredients:
                return ""
            
            # Try parsing as JSON first
            try:
                ingredients = json.loads(obj.ingredients)
                if isinstance(ingredients, list):
                    display_items = []
                    for ing in ingredients:
                        try:
                            item = Item.objects.get(id=ing.get('item'))
                            quantity = ing.get('quantity', 1)
                            display_items.append(f"{quantity} x {item.name}")
                        except (Item.DoesNotExist, KeyError, TypeError):
                            continue
                    return ", ".join(display_items) if display_items else obj.ingredients
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
            
            # If not JSON, it's already in text format, just return it
            return obj.ingredients
        except Exception as e:
            return obj.ingredients if obj.ingredients else ""


class SalesSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()

    class Meta:
        model = Sales
        fields = ['id', 'item', 'item_name', 'name', 'quantity', 'total', 'status', 'date', 'created_by']
        read_only_fields = []

    def get_item_name(self, obj):
        """Return the custom name (for recipes) or the item name (for items)"""
        return obj.name or obj.item.name

    def create(self, validated_data):
        """Auto-set date to now if not provided"""
        from django.utils import timezone
        if not validated_data.get('date'):
            validated_data['date'] = timezone.now()
        return super().create(validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'item', 'item_name', 'quantity', 'cost_price_at_time', 'amount', 'description', 'date']
        read_only_fields = ['date']

    def get_item_name(self, obj):
        """Return the name of the item this expense is for"""
        return obj.item.name
