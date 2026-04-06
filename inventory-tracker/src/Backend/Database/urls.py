from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, RecipeViewSet, SalesViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'sales', SalesViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
]
