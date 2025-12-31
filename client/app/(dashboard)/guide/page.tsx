import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GuidePage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="rounded-3xl bg-gradient-to-l from-brand-teal/10 via-brand-teal/5 to-surface px-8 py-10 shadow-[var(--shadow-soft)]">
        <h1 className="text-3xl font-bold text-heading mb-4">
          دليل استخدام منصة إدارة مطابع جامعة طيبة 📖
        </h1>
        <p className="text-muted max-w-3xl">
          مرحباً بك في دليل شامل لاستخدام المنصة. هنا ستجد شرحاً مفصلاً لكل نوع مستخدم،
          كيفية عمل المنصة، والميزات المتاحة لك.
        </p>
      </section>

      {/* How the Platform Works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-heading">كيف تعمل المنصة؟</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">1️⃣</span>
                <span>تقديم الطلب</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>
                المستخدم يقدم طلباً للتصميم أو الطباعة من خلال صفحة الخدمات.
                يتم إنشاء الطلب بحالة <Badge tone="info">بانتظار المراجعة</Badge>.
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>ملء النموذج بالتفاصيل المطلوبة</li>
                <li>رفع المرفقات إذا لزم الأمر</li>
                <li>تحديد الأولوية (عادي، عاجل، طارئ)</li>
              </ul>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">2️⃣</span>
                <span>المراجعة والاعتماد</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>
                مدير المطبعة يراجع الطلب ويمكنه:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>الموافقة على الطلب</li>
                <li>رفض الطلب مع إضافة ملاحظات</li>
                <li>تعليق الطلب مؤقتاً</li>
              </ul>
              <p className="mt-2">
                عند الموافقة، يتغير الحالة إلى <Badge tone="success">قيد التصميم/الإنتاج</Badge>.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">3️⃣</span>
                <span>التنفيذ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>
                موظف القسم يقوم بتنفيذ الطلب:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>تعيين الطلب للعمل عليه</li>
                <li>إكمال التصميم أو الطباعة</li>
                <li>تحديث الكمية الفعلية (للطباعة)</li>
                <li>نقل الطلب للمستودع عند الانتهاء</li>
              </ul>
              <p className="mt-2">
                يتم خصم المخزون تلقائياً عند تحديث الكمية الفعلية.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">4️⃣</span>
                <span>التأكيد والتسليم</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>
                المستخدم يتلقى إشعاراً بانتظار التأكيد:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>لديه 72 ساعة لتأكيد الطلب</li>
                <li>يمكنه طلب تعديلات إذا لزم الأمر</li>
                <li>عند التأكيد، يتغير الحالة إلى <Badge tone="success">مكتمل</Badge></li>
                <li>يمكن جدولة التسليم أو الاستلام</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-heading">الأدوار والصلاحيات</h2>
        
        {/* Consumer */}
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">👤</span>
              <div>
                <span>المستهلك (Consumer)</span>
                <Badge tone="info" className="mr-2">مستخدم عادي</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-heading mb-2">ما يمكنك فعله:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted mr-4">
                <li>إنشاء طلبات تصميم جديدة (بوستر، بروشور، شعار، إلخ)</li>
                <li>إنشاء طلبات طباعة (كروت شخصية، بنرات، أوراق رسمية، إلخ)</li>
                <li>متابعة حالة جميع طلباتك</li>
                <li>تأكيد الطلبات المكتملة خلال 72 ساعة</li>
                <li>طلب تعديلات على التصاميم المكتملة</li>
                <li>إنشاء طلبات زيارة (داخلية أو خارجية)</li>
                <li>إنشاء طلبات تدريب</li>
                <li>مشاهدة الإشعارات والتنبيهات</li>
                <li>جدولة استلام الطلبات الجاهزة</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-2">الميزات المتاحة:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">تقديم الطلبات</Badge>
                <Badge tone="success">متابعة الحالة</Badge>
                <Badge tone="success">الإشعارات</Badge>
                <Badge tone="success">طلبات الزيارة</Badge>
                <Badge tone="success">طلبات التدريب</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Manager */}
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">👔</span>
              <div>
                <span>مدير المطبعة (Print Manager)</span>
                <Badge tone="warning" className="mr-2">إداري</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-heading mb-2">ما يمكنك فعله:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted mr-4">
                <li>مراجعة جميع طلبات التصميم والطباعة</li>
                <li>الموافقة أو رفض الطلبات مع إضافة ملاحظات</li>
                <li>تعليق الطلبات مؤقتاً</li>
                <li>الموافقة على طلبات الزيارة</li>
                <li>إدارة الجهات والهيكل التنظيمي</li>
                <li>عرض التقارير الشاملة (ملخص، إنتاجية، توفير)</li>
                <li>إدارة إعدادات النظام</li>
                <li>مراقبة المخزون والتنبيهات</li>
                <li>إدارة المستخدمين والأدوار</li>
                <li>تحديث إعدادات الخدمات والحقول</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-2">الميزات المتاحة:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge tone="warning">الاعتماد والرفض</Badge>
                <Badge tone="warning">إدارة الجهات</Badge>
                <Badge tone="warning">التقارير</Badge>
                <Badge tone="warning">إدارة المستخدمين</Badge>
                <Badge tone="warning">إعدادات النظام</Badge>
                <Badge tone="warning">إدارة الخدمات</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Manager */}
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">👨‍💼</span>
              <div>
                <span>مدير القسم (Department Manager)</span>
                <Badge tone="info" className="mr-2">إشرافي</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-heading mb-2">ما يمكنك فعله:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted mr-4">
                <li>عرض جميع طلبات القسم</li>
                <li>تعليق الطلبات في القسم (مشاكل تقنية، نقص مواد، إلخ)</li>
                <li>متابعة إنتاجية القسم</li>
                <li>عرض تقارير الإنتاجية للقسم</li>
                <li>مراقبة تقدم الطلبات</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-2">الميزات المتاحة:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">متابعة القسم</Badge>
                <Badge tone="info">تعليق الطلبات</Badge>
                <Badge tone="info">تقارير الإنتاجية</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Employee */}
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">👷</span>
              <div>
                <span>موظف القسم (Department Employee)</span>
                <Badge tone="success" className="mr-2">تنفيذي</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-heading mb-2">ما يمكنك فعله:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted mr-4">
                <li>عرض الطلبات المخصصة لك</li>
                <li>تعيين الطلبات للتصميم أو الإنتاج</li>
                <li>تحديث حالة الطلبات أثناء العمل</li>
                <li>إدخال الكمية الفعلية للطلبات المطبوعة</li>
                <li>نقل الطلبات المكتملة للمستودع</li>
                <li>متابعة المخزون المستخدم في الطلبات</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-2">الميزات المتاحة:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">تنفيذ الطلبات</Badge>
                <Badge tone="success">تحديث الحالة</Badge>
                <Badge tone="success">إدخال الكمية</Badge>
                <Badge tone="success">نقل للمستودع</Badge>
              </div>
            </div>
            <div className="bg-brand-teal/10 p-4 rounded-lg">
              <p className="text-sm text-muted">
                <strong className="text-heading">ملاحظة مهمة:</strong> عند إدخال الكمية الفعلية،
                يتم خصم المخزون تلقائياً وتغيير حالة الطلب إلى "بانتظار التأكيد".
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Training Supervisor */}
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div>
                <span>مشرف التدريب (Training Supervisor)</span>
                <Badge tone="info" className="mr-2">تدريبي</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-heading mb-2">ما يمكنك فعله:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted mr-4">
                <li>عرض جميع طلبات التدريب</li>
                <li>الموافقة أو رفض طلبات التدريب</li>
                <li>إضافة تقييمات أسبوعية للمتدربين</li>
                <li>متابعة تقدم المتدربين</li>
                <li>إدارة فترة التدريب</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-2">الميزات المتاحة:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">إدارة التدريب</Badge>
                <Badge tone="info">التقييمات</Badge>
                <Badge tone="info">متابعة المتدربين</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">📦</span>
              <div>
                <span>مراقب المخزون (Inventory)</span>
                <Badge tone="warning" className="mr-2">مخزون</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-heading mb-2">ما يمكنك فعله:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted mr-4">
                <li>عرض جميع مواد المخزون</li>
                <li>إضافة مواد جديدة للمخزون</li>
                <li>تحديث الكميات الحالية</li>
                <li>إضافة سجلات إدخال/إخراج</li>
                <li>تحديث الحدود الدنيا والعليا</li>
                <li>مراقبة تنبيهات انخفاض المخزون</li>
                <li>إنشاء طلبات توريد</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading mb-2">الميزات المتاحة:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge tone="warning">إدارة المخزون</Badge>
                <Badge tone="warning">سجلات المخزون</Badge>
                <Badge tone="warning">التنبيهات</Badge>
                <Badge tone="warning">طلبات التوريد</Badge>
              </div>
            </div>
            <div className="bg-brand-teal/10 p-4 rounded-lg">
              <p className="text-sm text-muted">
                <strong className="text-heading">ملاحظة مهمة:</strong> يتم خصم المخزون تلقائياً
                عند تحديث الكمية الفعلية في طلبات الطباعة. النظام يرسل تنبيهات تلقائية عند
                انخفاض المخزون عن الحد الأدنى.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-heading">الميزات الرئيسية للمنصة</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">🔔</span>
              <CardTitle>نظام الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                تتلقى إشعارات فورية عند تغيير حالة طلبك، الموافقة، الرفض، أو أي تحديث مهم.
                يمكنك متابعة جميع الإشعارات من صفحة الإشعارات.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">📊</span>
              <CardTitle>التقارير والإحصائيات</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                للمدراء: تقارير شاملة عن الإنتاجية، التوفير المالي، المخزون، والمستخدمين.
                يمكن تصدير التقارير بصيغة Excel أو PDF.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">📦</span>
              <CardTitle>إدارة المخزون التلقائية</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                يتم خصم المخزون تلقائياً عند إكمال الطلبات. النظام يرسل تنبيهات عند انخفاض
                المخزون عن الحد الأدنى.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">⏰</span>
              <CardTitle>نظام التأكيد (72 ساعة)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                عند إكمال الطلب، لديك 72 ساعة لتأكيده. إذا لم تؤكد خلال هذه الفترة،
                يتم تعليق الطلب تلقائياً.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">📅</span>
              <CardTitle>طلبات الزيارة</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                يمكنك طلب زيارة داخلية أو خارجية للمطبعة. للزيارات الخارجية، يجب رفع
                تصريح. يتم جدولة الزيارات بعد الموافقة.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">🎓</span>
              <CardTitle>نظام التدريب</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                يمكن للطلاب تقديم طلبات تدريب. المشرفون يقومون بالموافقة وإضافة تقييمات
                أسبوعية لمتابعة التقدم.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">🔍</span>
              <CardTitle>البحث والفلترة</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                يمكنك البحث عن الطلبات حسب الحالة، النوع، التاريخ، أو أي معيار آخر.
                الفلترة المتقدمة تساعدك في العثور على ما تبحث عنه بسرعة.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">📱</span>
              <CardTitle>واجهة متجاوبة</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                المنصة تعمل بشكل ممتاز على جميع الأجهزة: الحاسوب، اللوحي، والهاتف المحمول.
                يمكنك الوصول للمنصة من أي مكان.
              </p>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <span className="text-3xl mb-2 block">🔐</span>
              <CardTitle>الأمان والصلاحيات</CardTitle>
            </CardHeader>
            <CardContent className="text-muted text-sm">
              <p>
                كل مستخدم يرى فقط ما لديه صلاحية للوصول إليه. النظام محمي بمصادقة JWT
                وكل إجراء يتم تسجيله في السجلات.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Order Status Flow */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-heading">حالات الطلبات</h2>
        <Card padding="lg" shadow="soft">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge tone="info">بانتظار المراجعة</Badge>
              <span className="text-muted">→</span>
              <Badge tone="warning">قيد الاعتماد</Badge>
              <span className="text-muted">→</span>
              <Badge tone="success">قيد التصميم/الإنتاج</Badge>
              <span className="text-muted">→</span>
              <Badge tone="info">بانتظار التأكيد</Badge>
              <span className="text-muted">→</span>
              <Badge tone="success">مكتمل</Badge>
            </div>
            <div className="bg-surface p-4 rounded-lg space-y-2 text-sm text-muted">
              <p><strong className="text-heading">بانتظار المراجعة:</strong> الطلب تم إنشاؤه ويحتاج مراجعة من مدير المطبعة.</p>
              <p><strong className="text-heading">قيد الاعتماد:</strong> الطلب قيد المراجعة من قبل المدير.</p>
              <p><strong className="text-heading">قيد التصميم/الإنتاج:</strong> تمت الموافقة والطلب قيد التنفيذ.</p>
              <p><strong className="text-heading">بانتظار التأكيد:</strong> الطلب مكتمل وانتظار تأكيد من المستخدم (72 ساعة).</p>
              <p><strong className="text-heading">مكتمل:</strong> تم تأكيد الطلب وهو جاهز للتسليم.</p>
              <p><strong className="text-heading">مرفوض:</strong> تم رفض الطلب من قبل المدير.</p>
              <p><strong className="text-heading">معلق:</strong> تم تعليق الطلب مؤقتاً.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tips Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-heading">نصائح للاستخدام الأمثل</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle className="text-lg">💡 للمستخدمين</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted space-y-2">
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>تأكد من ملء جميع الحقول المطلوبة عند تقديم الطلب</li>
                <li>راجع تفاصيل الطلب قبل التأكيد</li>
                <li>تابع الإشعارات بانتظام</li>
                <li>استخدم البحث والفلترة للعثور على الطلبات بسرعة</li>
                <li>تأكد من تأكيد الطلبات خلال 72 ساعة</li>
              </ul>
            </CardContent>
          </Card>

          <Card padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle className="text-lg">💡 للمدراء</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted space-y-2">
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>راجع الطلبات بانتظام واعتمدها في الوقت المناسب</li>
                <li>استخدم التقارير لمتابعة الأداء</li>
                <li>راقب تنبيهات المخزون</li>
                <li>أضف ملاحظات واضحة عند الرفض أو التعليق</li>
                <li>استخدم نظام الإشعارات للتواصل مع الفريق</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Section */}
      <section className="rounded-3xl bg-gradient-to-l from-brand-teal/10 via-brand-teal/5 to-surface px-8 py-10 shadow-[var(--shadow-soft)]">
        <h2 className="text-2xl font-semibold text-heading mb-4">الدعم والمساعدة</h2>
        <p className="text-muted mb-4">
          إذا واجهت أي مشكلة أو لديك استفسار، يمكنك:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted mr-4">
          <li>مراجعة هذا الدليل مرة أخرى</li>
          <li>التواصل مع مدير المطبعة</li>
          <li>مراجعة صفحة الإعدادات للمزيد من الخيارات</li>
        </ul>
      </section>
    </div>
  );
}








