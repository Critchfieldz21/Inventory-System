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
        """Convert ingredient item IDs to item names with quantities"""
        try:
            if not obj.ingredients:
                return ""
            
            ingredients = json.loads(obj.ingredients)
            if not isinstance(ingredients, list):
                return obj.ingredients
                
            display_items = []
            for ing in ingredients:
                try:
                    item = Item.objects.get(id=ing.get('item'))
                    quantity = ing.get('quantity', 1)
                    display_items.append(f"{quantity} x {item.name}")
                except (Item.DoesNotExist, KeyError, TypeError) as e:
                    # Skip items that don't exist
                    continue
            
            return ", ".join(display_items) if display_items else obj.ingredients
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            # If JSON parsing fails, return raw text
            return obj.ingredients if obj.ingredients else ""


class SalesSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = Sales
        fields = ['id', 'item', 'item_name', 'quantity', 'total', 'status', 'date', 'created_by']
        read_only_fields = ['date']
