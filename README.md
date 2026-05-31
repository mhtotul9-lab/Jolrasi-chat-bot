# কাপড় বিজনেস AI Chatbot 🇧🇩
### Facebook + WhatsApp অটো-রিপ্লে | সম্পূর্ণ ফ্রি (Google Gemini)

---

## সব খরচের হিসাব
| সার্ভিস | খরচ |
|---------|-----|
| GitHub | ফ্রি |
| Vercel | ফ্রি |
| Google Gemini API | ফ্রি (দিনে ১৫০০ মেসেজ) |
| Facebook/WhatsApp API | ফ্রি |
| **মোট** | **০ টাকা** |

---

## ধাপ ১ — Google Gemini API Key নিন (৫ মিনিট)

1. https://aistudio.google.com যান
2. Google account দিয়ে login করুন
3. বাম দিকে **"Get API Key"** ক্লিক করুন
4. **"Create API Key"** ক্লিক করুন
5. Key টা কপি করে কোথাও সেভ করুন
   - এরকম দেখতে: `AIzaSyXXXXXXXXXXXXXXXXXXXXX`

---

## ধাপ ২ — GitHub-এ কোড আপলোড (৫ মিনিট)

1. https://github.com যান, account না থাকলে বানান
2. উপরে **"+"** → **"New repository"** ক্লিক করুন
3. Repository name: `kapor-chatbot`
4. **"Create repository"** ক্লিক করুন
5. **"uploading an existing file"** ক্লিক করুন
6. এই ৩টা ফাইল আপলোড করুন:
   - `api/webhook.js` (আগে `api` ফোল্ডার বানান)
   - `package.json`
   - `vercel.json`
7. **"Commit changes"** ক্লিক করুন

---

## ধাপ ৩ — Vercel-এ Deploy (৫ মিনিট)

1. https://vercel.com যান
2. **"Sign Up"** → **"Continue with GitHub"**
3. **"New Project"** ক্লিক করুন
4. আপনার `kapor-chatbot` repo সিলেক্ট করুন
5. **"Deploy"** ক্লিক করুন
6. Deploy হলে URL পাবেন: `https://kapor-chatbot-xxx.vercel.app`
   → এই URL টা কপি করে রাখুন

---

## ধাপ ৪ — Vercel-এ Secret Keys দিন (৩ মিনিট)

1. Vercel Dashboard → আপনার project → **"Settings"**
2. বাম দিকে **"Environment Variables"**
3. নিচের ৫টা variable একে একে যোগ করুন:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | ধাপ ১-এ পাওয়া Google key |
| `VERIFY_TOKEN` | যেকোনো একটা শব্দ, যেমন: `amar_secret_2024` |
| `PAGE_ACCESS_TOKEN` | ধাপ ৬-এ পাবেন |
| `WHATSAPP_TOKEN` | ধাপ ৬-এ পাবেন |
| `WHATSAPP_PHONE_ID` | ধাপ ৬-এ পাবেন |

4. সব দেওয়ার পর **"Redeploy"** করুন

---

## ধাপ ৫ — Meta Developer App বানান (১০ মিনিট)

1. https://developers.facebook.com যান
2. উপরে **"My Apps"** → **"Create App"**
3. **"Business"** সিলেক্ট করুন → Next
4. App নাম দিন: `Kapor Chatbot` → **"Create App"**

---

## ধাপ ৬ — Facebook Messenger সেটআপ

1. App Dashboard-এ **"Add Product"** → **Messenger** → Set Up
2. **"Access Tokens"** সেকশনে আপনার Page সিলেক্ট করুন
3. **"Generate Token"** → Token কপি করুন
   → এটা `PAGE_ACCESS_TOKEN` — Vercel-এ দিন
4. **"Webhooks"** সেকশনে যান → **"Add Callback URL"**:
   - Callback URL: `https://আপনার-app.vercel.app/api/webhook`
   - Verify Token: আপনার `VERIFY_TOKEN` (ধাপ ৪-এ যেটা দিয়েছেন)
5. **"Verify and Save"** ক্লিক করুন
6. **"Add Subscriptions"** → `messages` টিক দিন → Save

---

## ধাপ ৭ — WhatsApp Business সেটআপ

1. App Dashboard-এ **"Add Product"** → **WhatsApp** → Set Up
2. **"API Setup"** পেজে:
   - **Phone Number ID** কপি করুন → Vercel-এ `WHATSAPP_PHONE_ID` দিন
   - **Temporary Token** কপি করুন → Vercel-এ `WHATSAPP_TOKEN` দিন
3. **"Configuration"** → **"Webhooks"** → **"Edit"**:
   - Callback URL: `https://আপনার-app.vercel.app/api/webhook`
   - Verify Token: আপনার `VERIFY_TOKEN`
4. **"Verify and Save"** → `messages` সাবস্ক্রাইব করুন

---

## সব হয়ে গেলে টেস্ট করুন

আপনার Facebook Page-এ মেসেজ করুন: **"আপনাদের কাপড়ের দাম কত?"**
AI বাংলায় অটো জবাব দেবে! 🎉

---

## সমস্যা হলে

- Vercel → আপনার project → **"Logs"** দেখুন
- লাল কিছু দেখলে স্ক্রিনশট নিয়ে সাহায্য নিন
