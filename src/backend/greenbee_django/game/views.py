from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def landing_page(request):
    return render(request, 'game/landing_page.html')
