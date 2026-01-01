# إعداد الإنتاج - ربط الباك اند والفرونت اند

## 🌐 الدومينات

- **الباك اند (Django)**: https://admin.pmstu.com
- **الفرونت اند (Next.js)**: https://www.pmstu.com

## ✅ التغييرات المطلوبة

### 1. في الباك اند (Django) - تم التحديث ✅

#### ملف `server/project/settings.py`:

**تم تحديث:**
- `ALLOWED_HOSTS`: إضافة `admin.pmstu.com`
- `CORS_ALLOWED_ORIGINS`: إضافة `https://www.pmstu.com` و `https://pmstu.com`

**السبب:**
- `ALLOWED_HOSTS`: يسمح لـ Django بقبول الطلبات من دومين `admin.pmstu.com`
- `CORS_ALLOWED_ORIGINS`: يسمح للفرونت اند (`www.pmstu.com`) بالوصول إلى API عبر CORS

### 2. في الفرونت اند (Next.js/Vercel) - مطلوب إعداد

#### في Vercel Dashboard:

1. اذهب إلى **Settings** → **Environment Variables**
2. أضف المتغير التالي:

```
NEXT_PUBLIC_API_BASE_URL=https://admin.pmstu.com/api
```

**السبب:**
- هذا المتغير يخبر الفرونت اند أين يجد الباك اند
- بدون هذا المتغير، الفرونت اند سيحاول الاتصال بـ `http://localhost:8000/api` (المحلي)

### 3. في ملف `.env` على السيرفر (اختياري)

إذا كنت تستخدم `.env` في الباك اند، تأكد من إضافة:

```env
ALLOWED_HOSTS=admin.pmstu.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://www.pmstu.com,https://pmstu.com,http://localhost:3000
DEBUG=False
SECRET_KEY=your-secret-key-here
```

## 📋 خطوات التطبيق

### على السيرفر (الباك اند):

```bash
# 1. تأكد من تحديث settings.py (تم بالفعل)
cd server

# 2. إذا كنت تستخدم .env، حدثه
nano .env  # أو vim .env

# 3. أعد تشغيل Django
# إذا كنت تستخدم systemd:
sudo systemctl restart gunicorn
# أو إذا كنت تستخدم supervisor:
sudo supervisorctl restart django

# 4. تحقق من أن CORS يعمل
curl -H "Origin: https://www.pmstu.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://admin.pmstu.com/api/accounts/users/
```

### في Vercel (الفرونت اند):

1. **إضافة Environment Variable:**
   - Settings → Environment Variables
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://admin.pmstu.com/api`
   - Environment: Production, Preview, Development

2. **إعادة النشر:**
   - بعد إضافة المتغير، Vercel سيعيد البناء تلقائياً
   - أو يمكنك إعادة النشر يدوياً

## 🔍 التحقق من العمل

### 1. تحقق من CORS:

افتح Console في المتصفح (F12) على `https://www.pmstu.com` وحاول تسجيل الدخول. يجب ألا ترى أخطاء CORS.

### 2. تحقق من API:

افتح Network tab في المتصفح وتحقق من:
- الطلبات تذهب إلى `https://admin.pmstu.com/api/...`
- الردود تحتوي على headers:
  ```
  Access-Control-Allow-Origin: https://www.pmstu.com
  Access-Control-Allow-Credentials: true
  ```

### 3. اختبار مباشر:

```bash
# اختبار API من الفرونت اند
curl -X GET https://admin.pmstu.com/api/accounts/users/ \
     -H "Origin: https://www.pmstu.com" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 حل المشاكل

### المشكلة: CORS Error في المتصفح

**الحل:**
1. تأكد من أن `CORS_ALLOWED_ORIGINS` يحتوي على `https://www.pmstu.com`
2. تأكد من أن `CORS_ALLOW_CREDENTIALS = True`
3. أعد تشغيل Django

### المشكلة: البيانات لا تظهر

**الحل:**
1. تأكد من إضافة `NEXT_PUBLIC_API_BASE_URL` في Vercel
2. تأكد من أن القيمة صحيحة: `https://admin.pmstu.com/api`
3. امسح cache المتصفح (Ctrl+Shift+R)
4. تحقق من Console للأخطاء

### المشكلة: 403 Forbidden

**الحل:**
1. تأكد من أن `ALLOWED_HOSTS` يحتوي على `admin.pmstu.com`
2. تحقق من إعدادات Nginx/Apache
3. تأكد من أن SSL يعمل بشكل صحيح

## 📝 ملاحظات مهمة

1. **HTTPS مطلوب**: تأكد من أن كلا الدومينين يستخدمان HTTPS
2. **Credentials**: `CORS_ALLOW_CREDENTIALS = True` يسمح بإرسال cookies و tokens
3. **Environment Variables**: في Vercel، المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` متاحة في المتصفح
4. **Rebuild**: بعد تغيير environment variables في Vercel، يجب إعادة البناء

## ✅ قائمة التحقق

- [ ] تحديث `ALLOWED_HOSTS` في Django
- [ ] تحديث `CORS_ALLOWED_ORIGINS` في Django
- [ ] إضافة `NEXT_PUBLIC_API_BASE_URL` في Vercel
- [ ] إعادة تشغيل Django
- [ ] إعادة نشر الفرونت اند في Vercel
- [ ] اختبار تسجيل الدخول
- [ ] التحقق من أن البيانات تظهر

---

**بعد تطبيق هذه الخطوات، يجب أن يعمل الفرونت اند مع الباك اند بشكل صحيح!** 🎉

