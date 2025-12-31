# دليل الرفع على Vercel

## المتطلبات

1. حساب Vercel (مجاني)
2. GitHub/GitLab/Bitbucket repository
3. متغيرات البيئة (Environment Variables)

## خطوات الرفع

### 1. إعداد المشروع

```bash
# تأكد من أنك في مجلد client
cd client

# تثبيت الحزم
npm install

# اختبار البناء محلياً
npm run build
```

### 2. رفع الكود إلى GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. ربط المشروع بـ Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط على "Add New Project"
3. اختر repository الخاص بك
4. في إعدادات المشروع:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 4. إعداد متغيرات البيئة

في Vercel Dashboard → Settings → Environment Variables، أضف:

```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api
```

**ملاحظة**: استبدل `https://your-backend-api.com/api` بعنوان API الخاص بك.

### 5. الرفع

### 6. اختبار المشروع

بعد اكتمال الرفع، Vercel سيعطيك رابط مثل:
```
https://your-project.vercel.app
```

## استكشاف الأخطاء

### خطأ في البناء

إذا فشل البناء:
1. تحقق من الأخطاء في Vercel Build Logs
2. تأكد من أن `npm run build` يعمل محلياً
3. تحقق من متغيرات البيئة

### خطأ في Runtime

إذا كان الموقع لا يعمل:
1. تحقق من Console في المتصفح
2. تأكد من أن `NEXT_PUBLIC_API_BASE_URL` صحيح
3. تحقق من CORS settings في الباك اند

## ملاحظات مهمة

- ✅ تم إصلاح جميع أخطاء TypeScript
- ✅ تم إعداد `next.config.mjs` للبناء
- ✅ تم إنشاء `vercel.json` للإعدادات
- ⚠️ تأكد من إعداد CORS في الباك اند للسماح بـ Vercel domain

## الدعم

إذا واجهت مشاكل، تحقق من:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

