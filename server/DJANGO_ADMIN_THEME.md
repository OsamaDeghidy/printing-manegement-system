# تحسين Django Admin Panel - Django Jazzmin

## ✅ ما تم إضافته

تم إضافة **Django Jazzmin** - ثيم حديث وجميل لـ Django Admin Panel مع دعم كامل للغة العربية.

## 📦 التثبيت

1. **تثبيت الحزم:**
```bash
cd server
pip install -r requirements.txt
```

2. **جمع الملفات الثابتة (Static Files):**
```bash
python manage.py collectstatic --noinput
```

3. **تشغيل السيرفر:**
```bash
python manage.py runserver
```

4. **افتح المتصفح:**
```
http://localhost:8000/admin/
```

## 🎨 المميزات

- ✅ تصميم حديث وجذاب
- ✅ دعم كامل للغة العربية (RTL)
- ✅ قائمة جانبية قابلة للطي
- ✅ أيقونات جميلة لكل نموذج
- ✅ بحث متقدم
- ✅ واجهة متجاوبة (Responsive)
- ✅ ألوان قابلة للتخصيص
- ✅ دعم الوضع الداكن (Dark Mode)

## ⚙️ التخصيص

يمكنك تخصيص الثيم من خلال ملف `settings.py` في قسم `JAZZMIN_SETTINGS`:

### تغيير الألوان:
```python
JAZZMIN_UI_TWEAKS = {
    "navbar": "navbar-dark",  # أو "navbar-light"
    "sidebar": "sidebar-dark-primary",  # أو "sidebar-light-primary"
    "theme": "default",  # أو "flatly", "cosmo", "cyborg", إلخ
}
```

### تغيير الأيقونات:
```python
JAZZMIN_SETTINGS = {
    "icons": {
        "orders.Order": "fas fa-shopping-cart",
        "accounts.User": "fas fa-user-tie",
        # ... إلخ
    }
}
```

## 📚 المزيد من الثيمات البديلة

إذا أردت تجربة ثيمات أخرى:

### 1. Django Grappelli (كلاسيكي)
```bash
pip install django-grappelli
```

### 2. Django Admin Interface (حديث جداً)
```bash
pip install django-admin-interface
```

### 3. Django Suit (مدفوع لكن ممتاز)
```bash
pip install django-suit
```

## 🔗 روابط مفيدة

- [Django Jazzmin Documentation](https://django-jazzmin.readthedocs.io/)
- [Django Jazzmin GitHub](https://github.com/farridav/django-jazzmin)
- [Font Awesome Icons](https://fontawesome.com/icons) (للأيقونات)

## 💡 نصائح

1. استخدم `show_ui_builder: True` في الإعدادات لتفعيل أداة التخصيص المرئي
2. يمكنك إضافة شعار خاص بك في `site_logo`
3. جرب الثيمات المختلفة من `JAZZMIN_UI_TWEAKS["theme"]`

---

**ملاحظة:** بعد التثبيت، ستحتاج إلى تسجيل الدخول إلى `/admin/` وستجد الواجهة الجديدة مباشرة!

