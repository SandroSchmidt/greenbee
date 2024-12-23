from django.shortcuts import redirect
from django.urls import path

from game import views

urlpatterns = [
    path('', lambda request: redirect('landing'), name='landing'),  # Redirect root URL to landing
    path('landing/', views.landing_page, name='landing'),

    # Other routes
]
