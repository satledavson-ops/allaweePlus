from django.shortcuts import render, get_object_or_404
from .models import PageContent

def page(request, slug):
    content = get_object_or_404(PageContent, slug=slug)
    return render(request, 'cms/page.html', {'content': content})
