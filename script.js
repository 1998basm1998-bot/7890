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

    // 🔴 دالة احترافية لإظهار الخطأ وتحديد مصدره (Google أو الكود)
    function showError(source, title, message) {
        let sourceLabel = source === 'google' ? '🌐 خطأ من خوادم جوجل' : '💻 خطأ في النظام الداخلي';
        let sourceClass = source === 'google' ? 'source-google' : 'source-system';
        
        smartErrorBox.innerHTML = `
            <div class="error-header">
                <span class="error-badge ${sourceClass}">${sourceLabel}</span>
                <strong>${title}</strong>
            </div>
            <div class="error-body" dir="ltr">${message}</div>
        `;
        smartErrorBox.style.display = 'block';
    }

    // 🟢 دالة لإخفاء صندوق الخطأ عند محاولة توليد جديدة
    function hideError() {
        smartErrorBox.style.display = 'none';
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
        hideError(); // تنظيف الأخطاء السابقة
        
        const title = titleInput.value.trim();
        if (!title) {
            showError('system', 'تنبيه إدخال الواجهة', 'يرجى كتابة عنوان المنتج في الحقل المخصص أولاً.');
            return;
        }

        const API_KEY = "AIzaSyAHUttJLiVjNTUHMPThR4qRFLiyb8nncLc";

        const originalBtnHtml = generateBtn.innerHTML;
        generateBtn.innerHTML = '⏳ جاري الاتصال والتحليل...';
        generateBtn.disabled = true;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            let parts = [];
            if (base64Image && mimeType) {
                parts.push({ "inlineData": { "mimeType": mimeType, "data": base64Image } });
                parts.push({ "text": `قم بكتابة وصف تسويقي مقنع وجذاب باللغة العربية لهذا المنتج. عنوان المنتج: "${title}". استعن بالصورة المرفقة لمعرفة تفاصيل المنتج.` });
            } else {
                parts.push({ "text": `قم بكتابة وصف تسويقي مقنع وجذاب باللغة العربية لمنتج يحمل العنوان: "${title}". اذكر مميزاته وفوائده المتوقعة للعميل.` });
            }

            const payload = { contents: [{ parts: parts }] };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // ===============================================
            // 🔍 نظام تشخيص أخطاء جوجل API وتحليل كود الرد
            // ===============================================
            if (!response.ok) {
                let errorDetails = data.error?.message || "رسالة خطأ غير معروفة من الخادم";
                let errorTitle = `كود الخطأ: HTTP ${response.status}`;
                let solution = "";
                
                if (response.status === 400 && errorDetails.includes("API key")) {
                    errorTitle = "مفتاح API غير صالح";
                    solution = "يرجى التأكد من أن مفتاح جوجل الخاص بك صحيح وتم نسخه بالكامل.";
                } else if (response.status === 403) {
                    errorTitle = "الوصول مرفوض (Forbidden)";
                    solution = "قد تكون الخدمة محظورة في بلدك أو أن مفتاحك مقيد. جرب تشغيل VPN.";
                } else if (response.status === 404) {
                    errorTitle = "النموذج غير مدعوم بمفتاحك";
                    solution = "مفتاحك الحالي لا يمتلك صلاحية الوصول لنموذج (gemini-1.5-flash). تحتاج لاستخراج مفتاح جديد من مشروع مختلف في Google AI Studio.";
                }
                
                let finalMessage = `${errorDetails}<br><br><span dir="rtl" style="color:#000; display:block; margin-top:10px;">💡 <b>تفسير النظام:</b> ${solution}</span>`;
                showError('google', errorTitle, finalMessage);
                return;
            }

            // في حال نجاح التوليد
            if (data.candidates && data.candidates.length > 0) {
                const generatedText = data.candidates[0].content.parts[0].text;
                descriptionInput.value = generatedText;
            } else {
                showError('google', 'استجابة فارغة (Empty Response)', 'نجح الاتصال بجوجل، ولكن الذكاء الاصطناعي لم يرسل أي نص في الوصف!');
            }

        } catch (error) {
            console.error(error);
            // أخطاء مثل انقطاع الإنترنت أو مشكلة في كتابة الأكواد
            showError('system', 'فشل في الاتصال بالخادم', error.message + "<br><br><span dir='rtl' style='color:#000; display:block;'>💡 <b>السبب الشائع:</b> انقطاع في الإنترنت أو وجود إضافة (AdBlocker) تمنع المتصفح من الاتصال بخوادم جوجل.</span>");
        } finally {
            generateBtn.innerHTML = originalBtnHtml;
            generateBtn.disabled = false;
        }
    });
});
