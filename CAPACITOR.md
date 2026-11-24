# بناء تطبيق باسل مؤنس (Capacitor)

الموقع الحالي يعمل كـ **PWA** على المتصفح.
الملفات التالية تجهّز نفس الكود كتطبيق Android / iOS عبر Capacitor.

## المتطلبات

- Node.js 18+
- لـ Android: Android Studio + JDK
- لـ iOS: Mac + Xcode

## الخطوات (Android)

```bash
# 1) تثبيت الحزم
npm install

# 2) إضافة منصة أندرويد (مرة واحدة)
npm run cap:add:android

# 3) مزامنة ملفات الويب مع المشروع الأصلي
npm run cap:sync

# 4) فتح Android Studio
npm run cap:android
```

من Android Studio:
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- أو Run على جهاز/محاكي

## الخطوات (iOS — يحتاج Mac)

```bash
npm install
npm run cap:add:ios
npm run cap:sync
npm run cap:ios
```

## ملاحظات مهمة

1. **`webDir`** مضبوط على `.` (جذر الموقع الثابت). لا تحتاج خطوة build للويب.
2. بعد أي تعديل على HTML/JS/CSS:
   ```bash
   npm run cap:sync
   ```
3. التشغيل في الخلفية (Background audio) يعتمد على Media Session الموجود في `app.js` + إعدادات النظام.
4. أيقونات التطبيق الأصلية داخل مجلد `android/app/src/main/res/` بعد `cap add android` — يمكن استبدالها من Android Studio.

## App ID

```
com.baselmoanes.app
```

يمكن تغييره في `capacitor.config.json` قبل أول `cap add`.
