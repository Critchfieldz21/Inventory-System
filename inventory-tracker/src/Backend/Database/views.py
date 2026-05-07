from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db.models import Sum
from .models import Item, Recipe, Sales, Expense
from .serializers import (
    ItemSerializer,
    RecipeSerializer,
    SalesSerializer,
    ExpenseSerializer,
    UserRegistrationSerializer,
    LoginSerializer,
)
from .xlsx_imports import (
    import_items_from_xlsx,
    import_recipes_from_xlsx,
    import_sales_from_xlsx,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'id': user.id,
                'username': user.username,
                'message': 'User created successfully.',
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        # authenticate performs secure hash verification of password
        if user is None:
            return Response(
                {'detail': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                'id': user.id,
                'username': user.username,
                'message': 'Login successful.',
            },
            status=status.HTTP_200_OK,
        )


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Item.objects.filter(user=user)
        return Item.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get items filtered by category"""
        category = request.query_params.get('category', None)
        if category:
            items = self.get_queryset().filter(category=category)
            serializer = self.get_serializer(items, many=True)
            return Response(serializer.data)
        return Response([])

    @action(detail=True, methods=['get'])
    def stock_status(self, request, pk=None):
        """Get stock status for an item"""
        item = self.get_object()
        total_sold = Sales.objects.filter(item=item).aggregate(Sum('quantity'))['quantity__sum'] or 0
        return Response({
            'id': item.id,
            'name': item.name,
            'stock': item.stock,
            'total_sold': total_sold,
            'in_stock': item.stock > 0,
            'low_stock': item.stock < 10,
        })
    
    @action(detail=False, methods=['get'])
    def with_sales_info(self, request):
        """Get all items with their total quantity sold"""
        items = self.get_queryset()
        data = []
        for item in items:
            total_sold = Sales.objects.filter(item=item).aggregate(Sum('quantity'))['quantity__sum'] or 0
            data.append({
                'id': item.id,
                'name': item.name,
                'category': item.category,
                'stock': item.stock,
                'price': str(item.price),
                'total_sold': total_sold,
                'created_at': item.created_at,
                'updated_at': item.updated_at,
            })
        return Response(data)

    @action(detail=False, methods=['post'])
    def import_xlsx(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded. Use form field "file".'}, status=status.HTTP_400_BAD_REQUEST)
        if not uploaded_file.name.lower().endswith('.xlsx'):
            return Response({'detail': 'Only .xlsx files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = import_items_from_xlsx(uploaded_file)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Recipe.objects.filter(user=user)
        return Recipe.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def import_xlsx(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded. Use form field "file".'}, status=status.HTTP_400_BAD_REQUEST)
        if not uploaded_file.name.lower().endswith('.xlsx'):
            return Response({'detail': 'Only .xlsx files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = import_recipes_from_xlsx(uploaded_file)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class SalesViewSet(viewsets.ModelViewSet):
    queryset = Sales.objects.all()
    serializer_class = SalesSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Sales.objects.filter(item__user=user)
        return Sales.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Get all completed sales"""
        sales = self.get_queryset().filter(status='Completed').order_by('-date')
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending sales"""
        sales = self.get_queryset().filter(status='Pending').order_by('-date')
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get sales from today"""
        from django.utils import timezone
        today = timezone.now().date()
        sales = self.get_queryset().filter(date__date=today).order_by('-date')
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def revenue_summary(self, request):
        """Get revenue summary"""
        sales = self.get_queryset().filter(status='Completed')
        total_revenue = sum(s.total for s in sales)
        
        return Response({
            'total_revenue': float(total_revenue),
            'total_sales': sales.count(),
            'avg_sale': float(total_revenue / sales.count()) if sales.count() > 0 else 0,
        })

    @action(detail=False, methods=['post'])
    def import_xlsx(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded. Use form field "file".'}, status=status.HTTP_400_BAD_REQUEST)
        if not uploaded_file.name.lower().endswith('.xlsx'):
            return Response({'detail': 'Only .xlsx files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = request.user if request.user.is_authenticated else None
            result = import_sales_from_xlsx(uploaded_file, created_by=user)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    CRUD for purchase/restock expenses.
    Created from the frontend whenever items are added to inventory.
    """
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Expense.objects.filter(item__user=user).order_by('-date')
        return Expense.objects.none()

    @action(detail=False, methods=['get'])
    def total(self, request):
        """Return the sum of all purchase expenses"""
        total = self.get_queryset().aggregate(total=Sum('amount'))['total'] or 0
        return Response({'total_expenses': float(total)})

    @action(detail=False, methods=['get'])
    def by_item(self, request):
        """Return all expenses for a specific item (pass ?item_id=<id>)"""
        item_id = request.query_params.get('item_id')
        if not item_id:
            return Response({'detail': 'item_id query param required.'}, status=status.HTTP_400_BAD_REQUEST)
        expenses = self.get_queryset().filter(item_id=item_id).order_by('-date')
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data)
