from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ItemViewSet,
    RecipeViewSet,
    SalesViewSet,
    ExpenseViewSet,
    RegisterView,
    LoginView,
    LogoutView,
    ResetPasswordView,
)

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'sales', SalesViewSet, basename='sales')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('', include(router.urls)),
]
