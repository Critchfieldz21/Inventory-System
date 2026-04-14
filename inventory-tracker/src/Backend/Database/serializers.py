from rest_framework import serializers
from .models import Item, Recipe, Sales
import json


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name', 'category', 'stock', 'cost_price', 'price', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        if data.get('cost_price') and data.get('price'):
            if data['cost_price'] >= data['price']:
                raise serializers.ValidationError('Cost price must be less than selling price.')
        return data


class RecipeSerializer(serializers.ModelSerializer):
    ingredients_display = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['id', 'name', 'ingredients', 'ingredients_display', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

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
            
            # If not JSON, it's already in text format - just return it
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
