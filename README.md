# پایتون‌یار
سایت تمرین پایتون (HTML + CSS + JS) با ادیتور رنگی و اجرای واقعی پایتون در مرورگر (Pyodide).

## انتشار روی GitHub Pages
1. یک repository بساز و محتوای همین پوشه را در ریشه‌ی آن آپلود کن (index.html باید در ریشه باشد).
2. Settings ← Pages ← Source: Deploy from a branch ← main / (root) ← Save.
3. بعد از چند دقیقه سایت روی https://USERNAME.github.io/REPO/ باز می‌شود.

## اجرای محلی
مرورگر برای Web Worker نیاز به سرور دارد: `python -m http.server` و سپس باز کردن http://localhost:8000

## ساختار
index.html · css/style.css · js/app.js (ادیتور، حساب کاربری، امتیاز) · js/exercises.js (۵۰ تمرین) · js/worker.js (اجرای پایتون)
