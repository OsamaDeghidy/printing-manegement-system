"""
Django settings for Taibah University Print Center Management backend.
"""

from datetime import timedelta
from pathlib import Path

import environ

# Build paths inside the project like this: BASE_DIR / "subdir".
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, True),
    SECRET_KEY=(str, "change-me"),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1", "admin.pmstu.com"]),
    DATABASE_URL=(str, f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
    CORS_ALLOWED_ORIGINS=(list, [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://www.pmstu.com",
        "https://pmstu.com",
    ]),
)
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(env_file)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env("DEBUG")

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")


# Application definition

INSTALLED_APPS = [
    "jazzmin",  # Must be before django.contrib.admin
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_spectacular",
    "django_filters",
    # Local apps
    "accounts",
    "entities",
    "catalog",
    "orders",
    "inventory",
    "notifications",
    "system",
    "visits",
    "training",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",  # Language support
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "project.wsgi.application"
ASGI_APPLICATION = "project.asgi.application"


# Database
DATABASES = {
    "default": env.db(),
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
LANGUAGE_CODE = "en"
TIME_ZONE = "Asia/Riyadh"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Supported languages
LANGUAGES = [
    ('ar', 'العربية'),
    ('en', 'English'),
]

LOCALE_PATHS = [
    BASE_DIR / "locale",
]


# Static & Media files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR / "project" / "static",
]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ),
    "PAGE_SIZE": 25,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Taibah Print Center API",
    "DESCRIPTION": "واجهة برمجية لإدارة طلبات الطباعة والمخزون والاعتمادات.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": SECRET_KEY,
    "ROTATE_REFRESH_TOKENS": True,
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

AUTH_USER_MODEL = "accounts.User"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Jazzmin Settings - Modern Django Admin Theme
JAZZMIN_SETTINGS = {
    # Title on the login screen (19 chars max)
    "site_title": "إدارة مطابع الجامعة",
    
    # Title on the brand (19 chars max)
    "site_brand": "مطابع طيبة",
    
    # Logo to use for your site, must be present in static files
    "site_logo": "admin/img/logo.png",
    
    # Logo to use for login form (relative to static files)
    "login_logo": "admin/img/logo.png",
    
    # Logo to use for login form in dark themes (relative to static files)
    "login_logo_dark": "admin/img/logo.png",
    
    # CSS classes that are applied to the logo above
    "site_logo_classes": "img-circle",
    
    # Welcome text on the login screen
    "welcome_sign": "مرحباً بك في لوحة إدارة مطابع طيبة",
    
    # Copyright on the footer
    "copyright": "جامعة طيبة - إدارة المطابع",
    
    # The model admin to search from the search bar
    "search_model": ["accounts.User", "orders.Order"],
    
    # Field name on user model that contains avatar ImageField/URLField/Charfield or a callable that receives the user
    "user_avatar": None,
    
    ############
    # Top Menu #
    ############
    
    # Links to put along the top menu
    "topmenu_links": [
        # Url that gets reversed (Permissions can be added)
        {"name": "الرئيسية", "url": "admin:index", "permissions": ["auth.view_user"]},
        
        # model admin to link to (Permissions checked against model)
        {"model": "accounts.User"},
        
        # App with dropdown menu to all its models pages (Permissions checked against models)
        {"app": "orders"},
    ],
    
    #############
    # User Menu #
    #############
    
    # Additional links to include in the user menu on the top right ("app" url type is not allowed)
    "usermenu_links": [
        {"model": "auth.user"}
    ],
    
    #############
    # Side Menu #
    #############
    
    # Whether to display the side menu
    "show_sidebar": True,
    
    # Whether to aut expand the menu
    "navigation_expanded": True,
    
    # Hide these apps when generating side menu e.g (auth)
    "hide_apps": [],
    
    # Hide these models when generating side menu (e.g auth.user)
    "hide_models": [],
    
    # List of apps (and/or models) to base side menu ordering off of
    "order_with_respect_to": ["accounts", "orders", "catalog", "inventory", "entities"],
    
    # Custom links to append to app groups, keyed on app name
    "custom_links": {
        "orders": [{
            "name": "تقارير الطلبات",
            "url": "admin:orders_order_changelist",
            "icon": "fas fa-chart-line",
            "permissions": ["orders.view_order"]
        }]
    },
    
    # Custom icons for side menu apps/models
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "accounts.User": "fas fa-user-tie",
        "orders.Order": "fas fa-shopping-cart",
        "orders.DesignOrder": "fas fa-palette",
        "orders.PrintOrder": "fas fa-print",
        "catalog.Service": "fas fa-concierge-bell",
        "catalog.ServiceField": "fas fa-list",
        "inventory.Item": "fas fa-box",
        "inventory.Transaction": "fas fa-exchange-alt",
        "entities.Entity": "fas fa-building",
        "notifications.Notification": "fas fa-bell",
        "visits.VisitRequest": "fas fa-calendar-check",
        "training.TrainingRequest": "fas fa-graduation-cap",
        "system.AuditLog": "fas fa-clipboard-list",
    },
    # Icons that are used when one is not manually specified
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    
    #################
    # Related Modal #
    #################
    # Use modals instead of popups
    "related_modal_active": False,
    
    #############
    # UI Tweaks #
    #############
    # Relative paths to custom CSS/JS scripts (must be present in static files)
    "custom_css": "admin/css/jazzmin_rtl.css",
    "custom_js": "admin/js/jazzmin_rtl.js",
    # Whether to link font from fonts.googleapis.com (use custom_css to supply font otherwise)
    "use_google_fonts_cdn": True,
    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": False,
    
    ###############
    # Change view #
    ###############
    # Render out the change view as a single form, or in tabs, current options are
    # - single
    # - horizontal_tabs (default)
    # - vertical_tabs
    # - collapsible
    # - carousel
    "changeform_format": "horizontal_tabs",
    # override change forms on a per modeladmin basis
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
    # Add a language dropdown into the admin
    "language_chooser": True,
}

# Jazzmin UI Tweaks
JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}
