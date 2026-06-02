const axios = require("axios");

const SYSTEM_PROMPT = `তুমি একটি বাংলাদেশি কাপড়ের বিজনেসের AI সহকারী।
সবসময় বাংলায় কথা বলবে।

বিজনেসের তথ্য:
- সব ধরনের কাপড়: শাড়ি, থ্রিপিস, পাঞ্জাবি, শার্ট, বাচ্চাদের কাপড়
- দাম: ৩০০ টাকা থেকে শুরু, ধরন অনুযায়ী আলাদা
- ডেলিভারি: সারা বাংলাদেশে কুরিয়ারে, ৩-৫ কার্যদিবস
- চার্জ: ঢাকায় ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা
- পেমেন্ট: বিকাশ, নগদ, রকেট, ক্যাশ অন ডেলিভারি
- অর্ডার: নাম + ঠিকানা + ফোন + কাপড়ের নাম জানালে অর্ডার হবে
- রিটার্ন: পণ্য পেলে ২৪ ঘণ্টার মধ্যে জানাতে হবে

নিয়ম:
- সংক্ষিপ্ত ও বন্ধুত্বপূর্ণ ভাষায় কথা বলবে
- ইমোজি ব্যবহার করো
- অর্ডার করতে উৎসাহিত করো
- কাপড়ের বাইরের বিষয়ে কথা বলবে না`;

async function getAIReply(userMessage) {
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
            const reply = await getAIReply(userText);
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
                const reply = await getAIReply(msg.text.body);
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
