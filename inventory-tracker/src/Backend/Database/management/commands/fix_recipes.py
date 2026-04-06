from django.core.management.base import BaseCommand
from Database.models import Item, Recipe
import json


class Command(BaseCommand):
    help = 'Fix corrupted recipe ingredients data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting recipe fix...'))
        
        # Define the correct recipes
        recipes_data = [
            {
                'name': 'Bacon Cheeseburger',
                'ingredients': [
                    {'item_name': 'Burger Buns', 'quantity': 1},
                    {'item_name': 'Beef Patties', 'quantity': 1},
                    {'item_name': 'Cheddar Cheese', 'quantity': 1},
                    {'item_name': 'Bacon', 'quantity': 2},
                    {'item_name': 'Lettuce', 'quantity': 1},
                ]
            },
            {
                'name': 'Chicken Burger',
                'ingredients': [
                    {'item_name': 'Burger Buns', 'quantity': 1},
                    {'item_name': 'Lettuce', 'quantity': 1},
                    {'item_name': 'Tomatoes', 'quantity': 1},
                    {'item_name': 'Pickles', 'quantity': 1},
                ]
            },
        ]
        
        for recipe_data in recipes_data:
            recipe = Recipe.objects.filter(name=recipe_data['name']).first()
            
            if not recipe:
                self.stdout.write(self.style.WARNING(f'Recipe not found: {recipe_data["name"]}'))
                continue
            
            # Build ingredients JSON with item IDs
            ingredients = []
            for ing in recipe_data['ingredients']:
                try:
                    item = Item.objects.get(name=ing['item_name'])
                    ingredients.append({
                        'item': item.id,
                        'quantity': ing['quantity']
                    })
                except Item.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'Item not found: {ing["item_name"]}'))
            
            # Update recipe with JSON ingredients
            recipe.ingredients = json.dumps(ingredients)
            recipe.save()
            
            self.stdout.write(self.style.SUCCESS(f'✓ Fixed recipe: {recipe.name}'))
            self.stdout.write(f'  Ingredients: {recipe.ingredients}')
        
        self.stdout.write(self.style.SUCCESS('Recipe fix completed!'))
