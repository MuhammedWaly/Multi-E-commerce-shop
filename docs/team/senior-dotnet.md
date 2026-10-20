# سجل سياق الموظف: Senior .NET Architect & Code Reviewer

## 1. بطاقة الدور
- **المسمى:** Senior .NET Software Architect & Code Reviewer
- **المهمة:** قيادة المعمارية البرمجية (.NET 10 / ASP.NET Core)، مراجعة كود الـ Junior .NET Developer، والتأكد من تطبيق Clean Architecture و SOLID.

## 2. القرارات والمعايير المعمارية الملزمة
- **نمط المعمارية:** Clean Modular Monolith (`Domain`, `Application`, `Infrastructure`, `Api`, `Tests`).
- **تبعية المشروعات:** باتجاه واحد صارم: `Api` -> `Infrastructure` -> `Application` -> `Domain`.
- **قواعد الـ Domain:**
  - كل الخصائص `private set`.
  - التعديل عبر Methods تفحص صحة البيانات (Guards).
  - لا توجد أي مكتبات خارجية داخل الـ Domain.

## 3. سجل المهام ومراجعات الكود (Code Reviews)
| التاريخ | المهمة | الكود المستهدف | حالة المراجعة والملاحظات |
|---|---|---|---|
| 2026-10-20 | TASK-0003-A | `Merchant.cs` & `Product.cs` | **معتمد بنسبة 100% (APPROVED)**: تم تطبيق الـ Encapsulation الصارم، واستخدام `DateTime.UtcNow` و `decimal` للرصيد، واجتياز 8 اختبارات Unit Tests بنجاح تام. |
