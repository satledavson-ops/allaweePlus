from django.apps import AppConfig
from django.shortcuts import render


class ContactConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'contact'


def contact(request):
    return render(request, 'contact/contact.html')
