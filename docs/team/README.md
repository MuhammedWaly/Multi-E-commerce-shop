# دليل نظام الموظفين المستقلين وسياق العمل الدائم (File-Backed Team Operating System)

تم تأسيس هذا النظام لتمكين المالك من مخاطبة أي موظف AI في الشركة كشخصية مستقلة لها ذاكرة وسجل قرارات دائم يستمر عبر الجلسات حتى بعد إغلاق Antigravity.

---

## 1. كيف تخاطب أي موظف داخل الشات؟

يمكنك التحدث مباشرة مع أي موظف بكتابة المناداة الخاصة به في بداية رسالتك:

| كود المناداة في الشات | اسم الموظف والدور | التخصص ومجال النقاش | ملف الذاكرة الدائم |
|---|---|---|---|
| **`@lead`** أو **`يا تيم ليد`** | **Team Lead** | التنسيق العام، الأولويات، مراجعة المراحل، توزيع المهام | [`team-lead.md`](file:///D:/AI%20Software%20Company/docs/team/team-lead.md) |
| **`@jdotnet`** أو **`يا جونيور دوت نت`** | **Junior .NET Developer** | كتابة كود C# / .NET 10، الـ Entities، والمهام التنفيذية | [`junior-dotnet.md`](file:///D:/AI%20Software%20Company/docs/team/junior-dotnet.md) |
| **`@dotnet`** أو **`يا سينيور دوت نت`** | **Senior .NET Architect & Reviewer** | معمارية الباك إند، مراجعة كود C#، الـ Clean Architecture، أداء الـ APIs | [`senior-dotnet.md`](file:///D:/AI%20Software%20Company/docs/team/senior-dotnet.md) |
| **`@react`** أو **`يا سينيور ريأكت`** | **Senior Frontend Developer** | واجهات React / TypeScript، الفيد التفاعلي، الـ Virtualization، أداء الموبايل | [`senior-frontend.md`](file:///D:/AI%20Software%20Company/docs/team/senior-frontend.md) |
| **`@qa`** أو **`يا مسؤول الجودة`** | **QA & Test Engineer** | خطط الاختبار، سيناريوهات الحافة (Edge Cases)، فحص السلوك الخاطئ | [`qa-engineer.md`](file:///D:/AI%20Software%20Company/docs/team/qa-engineer.md) |
| **`@sec`** أو **`يا مسؤول الأمان`** | **Security & Reliability Reviewer** | بوابات الدفع، فحص الـ Webhooks، تشفير البيانات، منع الاختراق | [`security-reviewer.md`](file:///D:/AI%20Software%20Company/docs/team/security-reviewer.md) |
| **`@pm`** أو **`يا مدير المنتج`** | **Product Manager & Market Validator** | متطلبات المنتج، تسعير الميزات، الجدوى وتجربة التاجر والمشتري | [`product-manager.md`](file:///D:/AI%20Software%20Company/docs/team/product-manager.md) |
| **`@research`** أو **`يا باحث الابتكار`** | **Creative & Market Researcher** | أفكار النمو الفيروسي، الشراء الاجتماعي، دراسة المنافسين وسلوك السوق | [`researcher.md`](file:///D:/AI%20Software%20Company/docs/team/researcher.md) |

---

## 2. بروتوكول تسليم كود المالك (Junior .NET Developer)

عندما تنهي كتابة كود الـ Domain أو أي مهمة برمجية:
* اكتب في الشات: **`Junior .NET : انا خلصت`**
* يدخل الـ Senior .NET تلقائياً لمراجعة الكود سطراً بسطر وتوثيق المراجعة في ملف سياقه.

---

## 3. قواعد استمرار الذاكرة (Memory Persistence Rules)
1. قبل أن يجيب أي موظف على نداء موجه له، يقرأ ملف سياقه الخاص في `docs/team/`.
2. بعد انتهاء النقاش المهم أو اتخاذ قرار فني، يتم توثيق القرار في جدول الذاكرة الخاص بالموظف ليبقى محفوظاً للأبد في Git.
