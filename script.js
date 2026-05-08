document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const generateBtn = document.getElementById('generateBtn');

    let base64Image = null;
    let mimeType = null;

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
        const title = titleInput.value.trim();
        if (!title) {
            alert('يرجى إدخال عنوان المنتج أولاً.');
            return;
        }

        const API_KEY = "AIzaSyAHUttJLiVjNTUHMPThR4qRFLiyb8nncLc";

        const originalBtnHtml = generateBtn.innerHTML;
        generateBtn.innerHTML = '⏳ جاري التوليد...';
        generateBtn.disabled = true;

        try {
            // ✅ تم حل المشكلة هنا بتغيير اسم النموذج إلى gemini-1.5-flash
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            let parts = [];
            
            if (base64Image && mimeType) {
                parts.push({
                    "inlineData": {
                        "mimeType": mimeType,
                        "data": base64Image
                    }
                });
                parts.push({
                    "text": `قم بكتابة وصف تسويقي مقنع وجذاب باللغة العربية لهذا المنتج. عنوان المنتج: "${title}". استعن بالصورة المرفقة لمعرفة تفاصيل المنتج، اذكر مميزاته وفوائده للعميل بطريقة ترويجية ومقنعة للعملاء.`
                });
            } else {
                parts.push({
                    "text": `قم بكتابة وصف تسويقي مقنع وجذاب باللغة العربية لمنتج يحمل العنوان: "${title}". اذكر مميزاته وفوائده المتوقعة للعميل بطريقة ترويجية تحفز على الشراء.`
                });
            }

            const payload = {
                contents: [{ parts: parts }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400 && data.error?.message.includes("API key not valid")) {
                    localStorage.removeItem('gemini_api_key'); 
                    throw new Error('مفتاح API غير صالح. يرجى المحاولة مرة أخرى وإدخال مفتاح صحيح.');
                }
                throw new Error(data.error?.message || 'خطأ في جلب البيانات من الخادم');
            }

            if (data.candidates && data.candidates.length > 0) {
                const generatedText = data.candidates[0].content.parts[0].text;
                descriptionInput.value = generatedText;
            } else {
                throw new Error('لم يتم إرجاع أي نص من الذكاء الاصطناعي.');
            }

        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التوليد: ' + error.message);
        } finally {
            generateBtn.innerHTML = originalBtnHtml;
            generateBtn.disabled = false;
        }
    });
});
