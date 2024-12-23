from django.shortcuts import redirect
from django.urls import path
from django.contrib.auth import views as auth_views

from greenbee_core import views
from greenbee_core.views import CustomLogoutView

urlpatterns = [
    path('', lambda request: redirect('landing'), name='landing'),  # Redirect root URL to landing
    path('login/', auth_views.LoginView.as_view(template_name='greenbee_core/login.html'), name='login'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('register/', views.register, name='register'),
    path('landing/', views.landing_page, name='landing'),

    # Other routes
]
