import secrets

from rest_framework import viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import Item, Recipe, Sales, Expense, UserSecret
from .serializers import (
    ItemSerializer,
    RecipeSerializer,
    SalesSerializer,
    ExpenseSerializer,
    UserRegistrationSerializer,
    LoginSerializer,
    ResetPasswordSerializer,
)
from .xlsx_imports import (
    import_items_from_xlsx,
    import_recipes_from_xlsx,
    import_sales_from_xlsx,
)


# Recovery codes use an unambiguous alphabet (no 0/O/1/I) so users transcribing
# them by hand are less likely to confuse characters.
_RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def _generate_recovery_code() -> str:
    raw = ''.join(secrets.choice(_RECOVERY_ALPHABET) for _ in range(16))
    return f'{raw[:4]}-{raw[4:8]}-{raw[8:12]}-{raw[12:16]}'


def _issue_recovery_code(user: User) -> str:
    plaintext = _generate_recovery_code()
    UserSecret.objects.update_or_create(
        user=user,
        defaults={'recovery_code_hash': make_password(plaintext)},
    )
    return plaintext


def _issue_token(user: User) -> str:
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user).key


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        recovery_code = _issue_recovery_code(user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'token': token.key,
                'username': user.username,
                'recovery_code': recovery_code,
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
        if user is None:
            return Response(
                {'detail': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)

        # Existing users from before recovery codes existed get one issued on
        # first login. The plaintext is returned exactly once so the client can
        # surface it to the user.
        new_recovery_code = None
        if not UserSecret.objects.filter(user=user).exists():
            new_recovery_code = _issue_recovery_code(user)

        payload = {'token': token.key, 'username': user.username}
        if new_recovery_code is not None:
            payload['recovery_code'] = new_recovery_code
        return Response(payload, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username'].strip()
        recovery_code = serializer.validated_data['recovery_code'].strip().upper()
        new_password = serializer.validated_data['new_password']

        invalid = Response(
            {'detail': 'Invalid username or recovery code.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return invalid

        secret = UserSecret.objects.filter(user=user).first()
        if secret is None or not check_password(recovery_code, secret.recovery_code_hash):
            return invalid

        user.set_password(new_password)
        user.save()

        new_recovery_code = _issue_recovery_code(user)
        token_key = _issue_token(user)

        return Response(
            {
                'token': token_key,
                'username': user.username,
                'recovery_code': new_recovery_code,
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
            result = import_items_from_xlsx(uploaded_file, user=request.user)
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
            result = import_recipes_from_xlsx(uploaded_file, user=request.user)
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
            result = import_sales_from_xlsx(uploaded_file, user=request.user, created_by=request.user)
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
