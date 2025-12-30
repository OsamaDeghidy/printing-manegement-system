from django.contrib import admin

from catalog.models import Service, ServiceField, ServiceFieldOption, ServicePricing


class ServiceFieldOptionInline(admin.TabularInline):
    model = ServiceFieldOption
    extra = 1


class ServiceFieldInline(admin.StackedInline):
    model = ServiceField
    extra = 1
    show_change_link = True
    inlines = [ServiceFieldOptionInline]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active", "requires_approval")
    list_filter = ("category", "is_active", "requires_approval")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ServiceFieldInline]


@admin.register(ServiceField)
class ServiceFieldAdmin(admin.ModelAdmin):
    list_display = ("label", "service", "field_type", "is_visible", "is_required", "order")
    list_filter = ("service", "field_type", "is_visible", "is_required")
    search_fields = ("label", "service__name")
    ordering = ("service", "order")
    inlines = [ServiceFieldOptionInline]


@admin.register(ServicePricing)
class ServicePricingAdmin(admin.ModelAdmin):
    list_display = ("service", "internal_cost", "external_cost", "effective_from", "effective_to")
    list_filter = ("service",)
    search_fields = ("service__name",)


