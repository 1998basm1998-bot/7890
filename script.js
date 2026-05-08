document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const generateBtn = document.getElementById('generateBtn');
    
    // عنصر صندوق الخطأ الذكي
    const smartErrorBox = document.getElementById('smartErrorBox');

    let base64Image = null;
    let mimeType = null;

    // 🔴 دالة احترافية لإظهار الخطأ وتحديد مصدره
    function showError(source, title, message) {
        let sourceLabel = source === 'google' ? '🌐 خطأ من خوادم جوجل' : '💻 خطأ في النظام الداخلي';
        let sourceClass = source === 'google' ? 'source-google' : 'source-system';
        
        if (smartErrorBox) {
            smartErrorBox.innerHTML = `
                <div class="error-header">
                    <span class="error-badge ${sourceClass}">${sourceLabel}</span>
                    <strong>${title}</strong>
                </div>
                <div class="error-body" dir="ltr">${message}</div>
            `;
            smartErrorBox.style.display = 'block';
        } else {
            // في حال نسيان إضافة الصندوق في HTML، يتم عرض الخطأ كنافذة عادية
            alert(title + "\n" + message.replace(/<[^>]*>?/gm, ''));
        }
    }

    // 🟢 دالة لإخفاء صندوق الخطأ
    function hideError() {
        if (smartErrorBox) {
            smartErrorBox.style.display = 'none';
        }
    }

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            mimeType = file.type;
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                imagePreview.src = result;
                imagePreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                
                base64Image = result.split(',')[1];
            };
            reader.readAsDataURL(file);
        }
    });

    generateBtn.addEventListener('click', async () => {
        hideError(); // إخفاء الأخطاء السابقة عند محاولة جديدة
        
        const title = titleInput.value.trim();
        if (!title) {
            showError('system', 'تنبيه إدخال الواجهة', 'يرجى كتابة عنوان المنتج في الحقل المخصص أولاً.');
            return;
        }

        // ✅ تم وضع مفتاحك الجديد هنا بنجاح!
        const API_KEY = "AIzaSyBmIXeA54jryMvEb-eCgCiVHVQae-LHvMs";

        const originalBtnHtml = generateBtn.innerHTML;
        generateBtn.innerHTML = '⏳ جاري الاتصال والتحليل...';
        generateBtn.disabled = true;

        try {
            let parts = [];
            if (base64Image && mimeType) {
                parts.push({ "inlineData": { "mimeType": mimeType, "data": base64Image } });
                parts.push({ "text": `قم بكتابة وصف تسويقي مقنع وجذاب باللغة العربية لهذا المنتج. عنوان المنتج: "${title}". استعن بالصورة المرفقة لمعرفة تفاصيل المنتج.` });
            } else {
                parts.push({ "text": `قم بكتابة وصف تسويقي مقنع وجذاب باللغة العربية لمنتج يحمل العنوان: "${title}". اذكر مميزاته وفوائده المتوقعة للعميل.` });
            }

            const payload = { contents: [{ parts: parts }] };

            // ==========================================
            // دمج نظام التبديل الذكي: تجربة النماذج بصمت
            // ==========================================
            const modelsToTry = (base64Image) ? 
                ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro-vision-latest"] : 
                ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];

            let success = false;
            let lastErrorDetails = "";
            let lastErrorStatus = 0;

            for (const model of modelsToTry) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    // إذا نجح التوليد، نضع النص في المربع ونخرج من الحلقة فوراً
                    if (response.ok && data.candidates && data.candidates.length > 0) {
                        descriptionInput.value = data.candidates[0].content.parts[0].text;
                        success = true;
                        break; 
                    } else {
                        // إذا فشل هذا النموذج، نحفظ الخطأ ونجرب النموذج الذي بعده
                        lastErrorDetails = data.error?.message || "رسالة خطأ غير معروفة من الخادم";
                        lastErrorStatus = response.status;
                        
                        // إذا كان الخطأ هو أن المفتاح غير صالح أساساً، فلا داعي لتجربة الباقي
                        if (response.status === 400 && lastErrorDetails.includes("API key")) {
                            break; 
                        }
                    }
                } catch (err) {
                    lastErrorDetails = err.message;
                }
            }

            // إذا فشلت كل النماذج، نظهر الصندوق الأحمر
            if (!success) {
                let errorTitle = `فشل جميع النماذج (HTTP ${lastErrorStatus})`;
                let solution = "";
                
                if (lastErrorStatus === 400 && lastErrorDetails.includes("API key")) {
                    errorTitle = "مفتاح API غير صالح";
                    solution = "يرجى التأكد من أن مفتاح جوجل الجديد الخاص بك صحيح وتم نسخه بالكامل.";
                } else if (lastErrorStatus === 403 || lastErrorDetails.includes("User location is not supported")) {
                    errorTitle = "الوصول مرفوض جغرافياً (Forbidden)";
                    solution = "بما أنك متواجد في دولة تحظرها جوجل (مثل العراق 🇮🇶)، فإن الخدمة مرفوضة. <br><br><b>الحل: الرجاء تشغيل تطبيق (VPN) على هاتفك والمحاولة مرة أخرى، وسيعمل التوليد فوراً.</b>";
                } else {
                    errorTitle = "النماذج غير مدعومة بمفتاحك نهائياً";
                    solution = "المفتاح الحالي يرفض جميع نماذج الذكاء الاصطناعي. يجب استخراج مفتاح جديد.";
                }
                
                let finalMessage = `${lastErrorDetails}<br><br><span dir="rtl" style="color:#000; display:block; margin-top:10px;">💡 <b>تفسير النظام:</b> ${solution}</span>`;
                showError('google', errorTitle, finalMessage);
            }

        } catch (error) {
            console.error(error);
            showError('system', 'فشل في الاتصال', error.message + "<br><br><span dir='rtl' style='color:#000; display:block;'>💡 <b>السبب الشائع:</b> انقطاع في الإنترنت أو وجود إضافة تمنع المتصفح من الاتصال بخوادم جوجل.</span>");
        } finally {
            generateBtn.innerHTML = originalBtnHtml;
            generateBtn.disabled = false;
        }
    });
});
