# Printing System - Frontend

## البناء للرفع على Vercel

### خطوات البناء

```bash
# تثبيت الحزم
npm install

# البناء للـ production
npm run build

# اختبار البناء محلياً
npm start
```

### متغيرات البيئة المطلوبة

أنشئ ملف `.env.production` في مجلد `client`:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api
```

### ملاحظات

- ✅ تم إصلاح جميع أخطاء TypeScript
- ✅ تم إعداد `next.config.mjs` للبناء
- ✅ المشروع جاهز للرفع على Vercel

### استكشاف الأخطاء

إذا واجهت مشاكل في البناء:
1. تأكد من تثبيت جميع الحزم: `npm install`
2. تحقق من أخطاء TypeScript: `npm run build`
3. تأكد من وجود متغيرات البيئة
