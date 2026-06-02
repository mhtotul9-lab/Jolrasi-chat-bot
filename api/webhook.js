const axios = require("axios");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function getProductsFromFirebase() {
  try {
    const snap = await db.collection('products').limit(30).get();
    const products = [];
    snap.forEach(doc => {
      const p = doc.data();
      if (p.name) {
        products.push({
          নাম: p.name || '',
          ক্যাটাগরি: p.category || '',
          মূল্য: p.sellingPrice || 0,
          স্টক: p.stock || 0,
        });
      }
    });
    console.log(`পণ্য পাওয়া গেছে: ${products.length}টি`);
    return products;
  } catch (err) {
    console.error("Firebase error:", err.message);
    return [];
  }
}

async function getAIReply(userMessage, products) {
  const productList = products.length > 0
    ? products.map((p, i) =>
        `${i + 1}. ${p.নাম}\n   ক্যাটাগরি: ${p.ক্যাটাগরি}\n   দাম: ৳${p.মূল্য}\n   স্টক: ${p.স্টক}টি`
      ).join('\n\n')
    : 'এখন কোনো পণ্য স্টকে নেই।';

  const prompt = `তুমি Jolrasi Clothing Brand-এর AI সহকারী।

ব্র্যান্ডের তথ্য:
- নাম: Jolrasi Clothing Brand
- ওয়েবসাইট: https://jolrasi.com
- Facebook: https://www.facebook.com/jolrasii
- ফোন: 01859-393487
- ডেলিভারি: সারা বাংলাদেশে, ঢাকায় ৬০৳, ঢাকার বাইরে ১২০৳, ৩-৫ কার্যদিবস
- পেমেন্ট: বিকাশ, নগদ, রকেট, ক্যাশ অন ডেলিভারি
- অর্ডার: নাম + ঠিকানা + ফোন + পণ্যের নাম + সাইজ দিলে অর্ডার হবে
- রিটার্ন: পণ্য পেলে ২৪ ঘণ্টার মধ্যে জানাতে হবে

আমাদের পণ্য তালিকা:
${productList}

গুরুত্বপূর্ণ নিয়ম:
- কাস্টমার বাংলা, ইংরেজি বা বাংলিশ (dam koto, price koto, ki ache, order korbo, stock ache, delivery charge, payment method) যেভাবেই লিখুক বুঝে সঠিক উত্তর দাও
- পণ্যের তালিকা দেখালে নম্বর দিয়ে সিরিয়ালি সুন্দর করে দেখাও
- সংক্ষিপ্ত ও বন্ধুত্বপূর্ণ ভাষায় কথা বলো
- ইমোজি ব্যবহার করো
- শুধু এই পণ্য তালিকার তথ্য দাও, বানিয়ে বলবে না

কাস্টমার বলেছে: "${userMessage}"

বাংলায় উত্তর দাও।`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jolrasi-chatbot.vercel.app",
          "X-Title": "Jolrasi Chatbot"
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content && content.trim()) return content.trim();
    return "দুঃখিত, একটু সমস্যা হচ্ছে। আবার চেষ্টা করুন 🙏";
  } catch (err) {
    console.error("AI error:", JSON.stringify(err.response?.data) || err.message);
    return "দুঃখিত, এখন একটু সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন 🙏";
  }
}

async function sendFBMessage(recipientId, text) {
  try {
    await axios.post(
      "https://graph.facebook.com/v18.0/me/messages",
      { recipient: { id: recipientId }, message: { text } },
      {
        params: { access_token: process.env.PAGE_ACCESS_TOKEN },
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    console.error("FB send error:", err.response?.data || err.message);
  }
}

async function sendWAMessage(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("WA send error:", err.response?.data || err.message);
  }
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "Verification failed" });
  }

  if (req.method === "POST") {
    const body = req.body;

    if (body.object === "page") {
      for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
          if (event.message && event.message.text && !event.message.is_echo) {
            console.log(`FB: ${event.sender.id}: ${event.message.text}`);
            const products = await getProductsFromFirebase();
            const reply = await getAIReply(event.message.text, products);
            await sendFBMessage(event.sender.id, reply);
          }
        }
      }
      return res.status(200).json({ status: "ok" });
    }

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const messages = change.value?.messages;
          if (messages) {
            for (const msg of messages) {
              if (msg.type === "text") {
                const products = await getProductsFromFirebase();
                const reply = await getAIReply(msg.text.body, products);
                await sendWAMessage(msg.from, reply);
              }
            }
          }
        }
      }
      return res.status(200).json({ status: "ok" });
    }

    return res.status(200).json({ status: "ok" });
  }

  res.status(405).json({ error: "Method Not Allowed" });
};
