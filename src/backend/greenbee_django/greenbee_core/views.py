from django.contrib.auth.views import LogoutView
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login
from greenbee_core.forms import EmailRegistrationForm


def register(request):
    if request.method == "POST":
        form = EmailRegistrationForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            # Create a new user with the email and password
            user = User.objects.create_user(username=email, email=email, password=password)
            login(request, user)  # Log the user in
            return redirect('landing')  # Replace 'landing' with your desired redirect view
    else:
        form = EmailRegistrationForm()

    return render(request, 'greenbee_core/register.html', {'form': form})


class CustomLogoutView(LogoutView):
    http_method_names = ["get", "post", "options"]

    def get(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)
