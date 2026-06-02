const axios = require("axios");
const admin = require("firebase-admin");

// Firebase Admin SDK initialize
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: "https://cloth-distribution-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

// Firebase থেকে সব পণ্য আনো
async function getProductsFromFirebase() {
  try {
    const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
    const products = [];
    snap.forEach(doc => {
      const p = doc.data();
      if (p.name) {
        products.push({
          নাম: p.name || '',
          ক্যাটাগরি: p.category || '',
          বিবরণ: p.description || '',
          বিক্রয়_মূল্য: p.sellingPrice || 0,
          স্টক: p.stock || 0,
        });
      }
    });
    return products;
  } catch (err) {
    console.error("Firebase error:", err.message);
    return [];
  }
}

// AI দিয়ে উত্তর নাও
async function getAIReply(userMessage, products) {
  const productList = products.length > 0
    ? products.map(p =>
        `- ${p.নাম} (${p.ক্যাটাগরি}): ৳${p.বিক্রয়_মূল্য}, স্টক: ${p.স্টক}${p.বিবরণ ? ', ' + p.বিবরণ : ''}`
      ).join('\n')
    : 'এখন কোনো পণ্য নেই।';

  const SYSTEM_PROMPT = `তুমি Jolrasi-র AI সহকারী। সবসময় বাংলায় কথা বলবে।

বিজনেসের তথ্য:
- ডেলিভারি: সারা বাংলাদেশে কুরিয়ারে, ৩-৫ কার্যদিবস
- চার্জ: ঢাকায় ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা
- পেমেন্ট: বিকাশ, নগদ, রকেট, ক্যাশ অন ডেলিভারি
- অর্ডার: নাম + ঠিকানা + ফোন + পণ্যের নাম জানালে অর্ডার হবে
- রিটার্ন: পণ্য পেলে ২৪ ঘণ্টার মধ্যে জানাতে হবে

এখন আমাদের পণ্য তালিকা:
${productList}

নিয়ম:
- শুধু এই পণ্য তালিকা থেকে তথ্য দেবে
- সংক্ষিপ্ত ও বন্ধুত্বপূর্ণ ভাষায় কথা বলবে
- ইমোজি ব্যবহার করো
- অর্ডার করতে উৎসাহিত করো
- পণ্যের বাইরের বিষয়ে কথা বলবে না`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
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
    return response.data.choices[0].message.content;
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
        to: to,
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
            const userText = event.message.text;
            const senderId = event.sender.id;
            console.log(`FB Message from ${senderId}: ${userText}`);
            const products = await getProductsFromFirebase();
            const reply = await getAIReply(userText, products);
            await sendFBMessage(senderId, reply);
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
