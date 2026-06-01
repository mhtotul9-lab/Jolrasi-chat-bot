# কাপড় বিজনেস AI Chatbot 🛍️

Facebook Messenger + WhatsApp Business-এর জন্য Google Gemini AI দিয়ে বাংলায় অটো-রিপ্লে চ্যাটবট।

## সম্পূর্ণ ফ্রি সেটআপ
- ✅ Google Gemini AI — দিনে ১৫০০ মেসেজ ফ্রি
- ✅ Vercel Hosting — ফ্রি
- ✅ GitHub — ফ্রি
- ✅ মাসিক খরচ: ০ টাকা

---

## ধাপ ১ — Gemini API Key নিন
1. https://aistudio.google.com/app/apikey যান
2. "Create API Key" ক্লিক করুন
3. Key কপি করে রাখুন

## ধাপ ২ — GitHub-এ আপলোড করুন
1. https://github.com/new যান
2. Repository name: `kapor-chatbot` দিন
3. Public সিলেক্ট করুন → Create repository
4. "uploading an existing file" ক্লিক করুন
5. এই ৪টি ফাইল আপলোড করুন:
   - `package.json`
   - `vercel.json`
   - `.env.example`
   - `api/webhook.js` (api ফোল্ডারসহ)

## ধাপ ৩ — Vercel-এ Deploy করুন
1. https://vercel.com/new যান
2. GitHub দিয়ে Login করুন
3. `kapor-chatbot` repo সিলেক্ট করুন
4. Deploy বাটনে ক্লিক করুন
5. আপনার URL পাবেন: `https://kapor-chatbot.vercel.app`

## ধাপ ৪ — Environment Variables সেট করুন
Vercel Dashboard → আপনার Project → Settings → Environment Variables

| Key | Value |
|-----|-------|
| GEMINI_API_KEY | Google AI Studio-র key |
| VERIFY_TOKEN | যেকোনো গোপন শব্দ, যেমন: amar_secret_2024 |
| PAGE_ACCESS_TOKEN | Facebook Page Token |
| WHATSAPP_TOKEN | WhatsApp Temporary Token |
| WHATSAPP_PHONE_ID | WhatsApp Phone Number ID |

Keys যোগ করার পর **Redeploy** করুন।

## ধাপ ৫ — Facebook Webhook Connect করুন
1. https://developers.facebook.com/apps যান
2. New App → Business type → Create
3. Messenger → Settings → Webhooks → Add Callback URL:
   ```
   https://আপনার-url.vercel.app/api/webhook
   ```
4. Verify Token: আপনার VERIFY_TOKEN দিন
5. Verify and Save → messages সাবস্ক্রাইব করুন

## ধাপ ৬ — WhatsApp Webhook Connect করুন
1. WhatsApp → Configuration → Webhook URL:
   ```
   https://আপনার-url.vercel.app/api/webhook
   ```
2. Verify Token: একই VERIFY_TOKEN দিন
3. Verify and Save → messages সাবস্ক্রাইব করুন

---

## Webhook URL
```
https://আপনার-url.vercel.app/api/webhook
```

## সমস্যা হলে
Vercel Dashboard → আপনার Project → Functions → webhook.js → Logs দেখুন
