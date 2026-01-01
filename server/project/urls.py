from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.urls import include, path
from django.utils.translation import gettext_lazy as _
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomTokenObtainPairView

api_urlpatterns = [
    path("accounts/", include("accounts.urls")),
    path("entities/", include("entities.urls")),
    path("catalog/", include("catalog.urls")),
    path("", include("orders.urls")),
    path("", include("inventory.urls")),
    path("", include("notifications.urls")),
    path("", include("system.urls")),
    path("", include("visits.urls")),
    path("", include("training.urls")),
    path("auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

# Admin URLs with language support
urlpatterns = i18n_patterns(
    path("admin/", admin.site.urls),
    prefix_default_language=False,  # Don't prefix default language (Arabic)
)

# API URLs (no language prefix needed)
urlpatterns += [
    path("api/", include((api_urlpatterns, "api"), namespace="api")),
]

# Language switcher
urlpatterns += [
    path("i18n/", include("django.conf.urls.i18n")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
