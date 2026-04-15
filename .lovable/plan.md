

# خطة تنفيذ نظام سنا الآي — الكاملة

## ملخص
بناء نظام إدارة مقرأة سنا الآي كاملاً: قاعدة بيانات + مصادقة + 7 صفحات رئيسية + حساب أوجه تلقائي + بيانات تجريبية.

---

## المرحلة 1: قاعدة البيانات والبنية التحتية

### 1.1 إنشاء الجداول عبر Migrations

**الجداول المطلوبة:**

- **`tracks`** — المسارات التسعة مع النوع (girls/children/mothers/tilawa)
- **`halaqat`** — كل الحلقات (85 حلقة) مرتبطة بالمسار
- **`profiles`** — بيانات المستخدم (الاسم، العمر، الجوال، واتساب، البلد، المستوى، اتجاه الحفظ، is_archived)
- **`user_roles`** — enum (leader, data_entry, teacher, supervisor, track_manager, student)
- **`track_managers`** — ربط مسؤولات المسارات
- **`data_entry_assignments`** — ربط مدخلات البيانات بمساراتهم
- **`halaqah_students`** — ربط الطالبات بالحلقات (مع is_archived)
- **`quran_pages`** — 1,211 صف (surah_number, surah_name, ayah_number, page_number)
- **`daily_records`** — السجلات اليومية (حفظ، مراجعة قريبة/بعيدة، تلاوة، غياب)
- **`registration_settings`** — فتح/إغلاق التسجيل + حقول مخصصة

### 1.2 دالة الأمان + RLS

- دالة `has_role()` كـ security definer
- سياسات RLS لكل جدول حسب الدور

### 1.3 Trigger لإنشاء profile تلقائياً عند التسجيل

### 1.4 تعبئة البيانات المبدئية
- 9 مسارات + 85 حلقة
- جدول quran_pages (1,211 صف)

---

## المرحلة 2: الثيم والتخطيط

### 2.1 تحديث index.css
- ألوان بنفسجي وأزرق باستيل بصيغة HSL
- متغيرات CSS مخصصة

### 2.2 إضافة خط Cairo
- تحميل من Google Fonts في index.html
- تطبيق RTL على html

### 2.3 تخطيط رئيسي
- Sidebar للتنقل (يتغير حسب الدور)
- شريط علوي مع ticker "الحلقات المتميزة"

---

## المرحلة 3: المصادقة والتسجيل

### 3.1 الملفات:
- `src/pages/Login.tsx` — تسجيل دخول
- `src/pages/Register.tsx` — تسجيل (قسمين)
- `src/pages/ResetPassword.tsx`
- `src/hooks/useAuth.ts` — حالة المصادقة
- `src/contexts/AuthContext.tsx`

### 3.2 نموذج التسجيل (القسم الأول)
- طالبات: الاسم، العمر (قائمة)، الجوال، واتساب، البلد، الإيميل، كلمة السر، المستوى الدراسي، اتجاه الحفظ، المسار، الحلقة
- معلمات/مشرفات: الاسم، العمر، البلد، الجوال، واتساب، الإيميل، كلمة السر، المسار، الحلقة
- مسؤولات مسارات: اسم المسار، الإيميل، كلمة السر

### 3.3 القسم الثاني (المستجدات)
- أسئلة قابلة للتعديل من القائدة
- فتح/إغلاق
- إضافة تلقائية لحلقة "التسجيل"

---

## المرحلة 4: صفحات النظام

### 4.1 هيكل الملفات الجديدة:

```text
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          — التخطيط الرئيسي + sidebar
│   │   ├── Sidebar.tsx            — قائمة جانبية حسب الدور
│   │   └── NewsTicker.tsx         — شريط الحلقات المتميزة
│   ├── data-entry/
│   │   ├── DataEntryForm.tsx      — نموذج الإدخال الرئيسي
│   │   ├── SurahAyahSelector.tsx  — منتقي السورة والآية
│   │   └── StudentRecord.tsx      — سجل طالبة واحدة
│   ├── statistics/
│   │   ├── StatsOverview.tsx      — نظرة عامة
│   │   └── DateRangeFilter.tsx    — فلتر زمني
│   ├── halaqat/
│   │   ├── HalaqahList.tsx        — قائمة الحلقات
│   │   └── HalaqahDetails.tsx     — تفاصيل حلقة
│   └── shared/
│       ├── ProgressBar.tsx        — شريط تقدم
│       └── WhatsAppButton.tsx     — زر واتساب
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ResetPassword.tsx
│   ├── leader/
│   │   ├── LeaderDashboard.tsx    — لوحة القائدة
│   │   ├── HalaqatPage.tsx        — صفحة الحلقات
│   │   ├── DataEntryStatus.tsx    — حالة المدخلات
│   │   ├── AccountsPage.tsx       — إدارة الحسابات
│   │   ├── StatisticsPage.tsx     — الإحصائيات
│   │   ├── RegistrationPage.tsx   — إدارة التسجيل
│   │   └── AbsencesPage.tsx       — الغيابات
│   ├── data-entry/
│   │   └── DataEntryPage.tsx      — صفحة الإدخال
│   ├── teacher/
│   │   └── TeacherDashboard.tsx   — لوحة المعلمة
│   ├── student/
│   │   └── StudentDashboard.tsx   — لوحة الطالبة
│   └── track-manager/
│       └── TrackManagerDashboard.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useQuranPages.ts          — حساب الأوجه
│   ├── useHalaqat.ts
│   ├── useDailyRecords.ts
│   └── useStatistics.ts
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── quran-utils.ts            — حساب الأوجه بالكسور
│   └── supabase.ts               — عميل Supabase (موجود)
└── types/
    └── database.ts               — أنواع TypeScript
```

### 4.2 صفحة إدخال البيانات (الأهم)
- قوائم منسدلة فقط (114 سورة + آياتها)
- حساب أوجه تلقائي من جدول quran_pages
- حسب نوع المسار: فتيات (3 خانات) / أطفال وأمهات (2) / تلاوة (1)
- زر "غائبة" عند كل اسم

### 4.3 صفحة الإحصائيات
- فلتر زمني (أسبوع/شهر/مخصص)
- أوجه حفظ، مراجعة قريبة، مراجعة بعيدة
- أعداد (فتيات، أمهات، أطفال)
- غائبات، الحلقة الأكثر إنجازاً
- أرقام بالكسور (99,5)

### 4.4 صفحة الغيابات
- غائبات اليوم + متكررات الغياب
- زر واتساب (wa.me/{whatsapp_number})

### 4.5 شريط الحلقات المتميزة
- الحلقات الأقل غياباً لليوم
- تصميم شريط أخباري متحرك بألوان جميلة

---

## المرحلة 5: حساب الأوجه

### المنطق في `quran-utils.ts`:
- استعلام quran_pages لإيجاد رقم الوجه لنقطة البداية والنهاية
- الفرق = عدد الأوجه (بالكسور)
- عرض بفاصلة عربية

---

## المرحلة 6: البيانات التجريبية

عبر أداة insert:
- 1 قائدة: "نورة القحطاني"
- 3 مدخلات: "رحاب" (بهور)، "سارة" (إشراق)، "هدى" (قبس)
- 5 معلمات موزعات على حلقات
- 20 طالبة موزعات (4 لكل مسار فتيات)
- سجلات يومية تجريبية لأسبوع

---

## التفاصيل التقنية

| العنصر | التقنية |
|--------|---------|
| الألوان | بنفسجي HSL(263, 90%, 66%) + أزرق باستيل HSL(213, 94%, 78%) |
| الخط | Cairo من Google Fonts |
| الاتجاه | `dir="rtl"` على html |
| حساب الأوجه | lookup table + فرق الصفحات |
| واتساب | `https://wa.me/{number}` |
| الأرشيف | `is_archived = true` بدون حذف |

