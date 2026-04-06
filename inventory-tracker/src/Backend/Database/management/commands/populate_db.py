from django.core.management.base import BaseCommand
from Database.models import Item, Recipe, Sales
from django.contrib.auth.models import User
import json
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Populate the database with sample burger shop data'

    def handle(self, *args, **options):
        # Check if data already exists
        if Item.objects.exists():
            self.stdout.write(self.style.WARNING('Database already populated. Skipping...'))
            return

        # Get or create admin user
        admin_user = User.objects.get_or_create(username='admin')[0]

        # ========== CREATE ITEMS ==========
        self.stdout.write('Creating items...')
        
        items_data = [
            {'name': 'Burger Buns', 'category': 'Ingredients', 'stock': 50, 'price': '2.50'},
            {'name': 'Beef Patties', 'category': 'Ingredients', 'stock': 45, 'price': '4.00'},
            {'name': 'Cheddar Cheese', 'category': 'Ingredients', 'stock': 60, 'price': '3.25'},
            {'name': 'Bacon', 'category': 'Ingredients', 'stock': 35, 'price': '5.50'},
            {'name': 'Lettuce', 'category': 'Ingredients', 'stock': 22, 'price': '1.50'},
            {'name': 'Tomatoes', 'category': 'Ingredients', 'stock': 12, 'price': '2.00'},
            {'name': 'Pickles', 'category': 'Ingredients', 'stock': 18, 'price': '1.75'},
            {'name': 'Onions', 'category': 'Ingredients', 'stock': 5, 'price': '1.00'},
            {'name': 'Tomato Sauce', 'category': 'Condiments', 'stock': 30, 'price': '0.75'},
        ]

        items = {}
        for item_data in items_data:
            item, created = Item.objects.get_or_create(
                name=item_data['name'],
                defaults={
                    'category': item_data['category'],
                    'stock': item_data['stock'],
                    'price': item_data['price']
                }
            )
            items[item_data['name']] = item
            if created:
                self.stdout.write(f"  ✓ Created item: {item.name}")
            else:
                self.stdout.write(f"  • Item exists: {item.name}")

        # ========== CREATE RECIPES ==========
        self.stdout.write('Creating recipes...')
        
        recipes_data = [
            {
                'name': 'Classic Burger',
                'ingredients': [
                    {'item': 'Burger Buns', 'quantity': 1},
                    {'item': 'Beef Patties', 'quantity': 1},
                    {'item': 'Lettuce', 'quantity': 1},
                    {'item': 'Tomatoes', 'quantity': 1},
                ]
            },
            {
                'name': 'Bacon Cheeseburger',
                'ingredients': [
                    {'item': 'Burger Buns', 'quantity': 1},
                    {'item': 'Beef Patties', 'quantity': 1},
                    {'item': 'Cheddar Cheese', 'quantity': 1},
                    {'item': 'Bacon', 'quantity': 2},
                    {'item': 'Lettuce', 'quantity': 1},
                ]
            },
            {
                'name': 'Chicken Burger',
                'ingredients': [
                    {'item': 'Burger Buns', 'quantity': 1},
                    {'item': 'Lettuce', 'quantity': 1},
                    {'item': 'Tomatoes', 'quantity': 1},
                    {'item': 'Pickles', 'quantity': 1},
                ]
            },
        ]

        recipes = {}
        for recipe_data in recipes_data:
            # Convert ingredient objects to JSON with item IDs
            ingredients = []
            for ing in recipe_data['ingredients']:
                ingredient_item = items[ing['item']]
                ingredients.append({
                    'item': ingredient_item.id,
                    'quantity': ing['quantity']
                })

            recipe, created = Recipe.objects.get_or_create(
                name=recipe_data['name'],
                defaults={'ingredients': json.dumps(ingredients)}
            )
            recipes[recipe_data['name']] = recipe
            if created:
                self.stdout.write(f"  ✓ Created recipe: {recipe.name}")
            else:
                self.stdout.write(f"  • Recipe exists: {recipe.name}")

        # ========== CREATE SALES ==========
        self.stdout.write('Creating sales transactions...')
        
        sales_data = [
            {'item': 'Burger Buns', 'quantity': 2, 'total': '5.00', 'status': 'Completed', 'days_ago': 0},
            {'item': 'Beef Patties', 'quantity': 3, 'total': '12.00', 'status': 'Completed', 'days_ago': 0},
            {'item': 'Cheddar Cheese', 'quantity': 1, 'total': '3.25', 'status': 'Completed', 'days_ago': 0},
            {'item': 'Bacon', 'quantity': 2, 'total': '11.00', 'status': 'Completed', 'days_ago': 1},
            {'item': 'Lettuce', 'quantity': 5, 'total': '7.50', 'status': 'Completed', 'days_ago': 1},
            {'item': 'Tomatoes', 'quantity': 3, 'total': '6.00', 'status': 'Pending', 'days_ago': 2},
        ]

        sales_count = 0
        for sale_data in sales_data:
            sale_item = items[sale_data['item']]
            sale_date = datetime.now() - timedelta(days=sale_data['days_ago'])
            
            sale, created = Sales.objects.get_or_create(
                item=sale_item,
                date=sale_date.date(),
                quantity=sale_data['quantity'],
                defaults={
                    'total': sale_data['total'],
                    'status': sale_data['status'],
                    'created_by': admin_user
                }
            )
            if created:
                sales_count += 1
                self.stdout.write(f"  ✓ Created sale: {sale_item.name} (${sale.total})")
            else:
                self.stdout.write(f"  • Sale exists: {sale_item.name}")

        # ========== SUMMARY ==========
        self.stdout.write(self.style.SUCCESS('\n✓ Database populated successfully!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  • Items: {Item.objects.count()}')
        self.stdout.write(f'  • Recipes: {Recipe.objects.count()}')
        self.stdout.write(f'  • Sales: {Sales.objects.count()}')
