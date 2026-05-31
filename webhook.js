// ============================================
// কাপড় বিজনেস AI Chatbot
// Facebook Messenger + WhatsApp Business API
// AI: Google Gemini (সম্পূর্ণ ফ্রি)
// ============================================

const GEMINI_API_KEY    = process.env.GEMINI_API_KEY;       // Google AI Studio থেকে ফ্রি
const VERIFY_TOKEN      = process.env.VERIFY_TOKEN;         // যেকোনো একটা শব্দ দিন
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;    // Facebook Page Token
const WHATSAPP_TOKEN    = process.env.WHATSAPP_TOKEN;       // WhatsApp Business Token
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;    // WhatsApp Phone Number ID

// ============================================
// আপনার বিজনেসের তথ্য এখানে আপডেট করুন
// ============================================
const BUSINESS_INFO = `
তুমি একটি বাংলাদেশি কাপড়ের বিজনেসের AI সহকারী। সবসময় বাংলায় কথা বলবে।

বিজনেসের তথ্য:
- সব ধরনের কাপড়: শাড়ি, থ্রিপিস, পাঞ্জাবি, শার্ট, বাচ্চাদের কাপড়
- দাম: ৩০০ টাকা থেকে শুরু, ধরন অনুযায়ী আলাদা
- ডেলিভারি: সারা বাংলাদেশে কুরিয়ারে, ৩-৫ কার্যদিবস
- ডেলিভারি চার্জ: ঢাকায় ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা
- পেমেন্ট: বিকাশ, নগদ, রকেট, ক্যাশ অন ডেলিভারি
- অর্ডার: নাম, ঠিকানা, ফোন নম্বর ও পছন্দের কাপড় জানালে অর্ডার নেওয়া হবে
- রিটার্ন: পণ্য পেলে ২৪ ঘণ্টার মধ্যে সমস্যা জানাতে হবে

নিয়ম:
- সংক্ষিপ্ত ও বন্ধুত্বপূর্ণ ভাষায় কথা বলবে
- ইমোজি ব্যবহার করো
- কাস্টমারকে অর্ডার করতে উৎসাহিত করো
- কাপড়ের বাইরের কোনো বিষয়ে কথা বলবে না
`;

// ============================================
// Gemini দিয়ে AI জবাব তৈরি (সম্পূর্ণ ফ্রি)
// ============================================
async function getAIReply(userMessage) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: BUSINESS_INFO }]
        },
        contents: [
          { role: "user", parts: [{ text: userMessage }] }
        ],
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7,
        }
      }),
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text;
    }

    return "দুঃখিত, একটু সমস্যা হচ্ছে। আবার চেষ্টা করুন।";

  } catch (error) {
    console.error("Gemini Error:", error);
    return "দুঃখিত, এই মুহূর্তে সমস্যা হচ্ছে। একটু পরে আবার মেসেজ করুন।";
  }
}

// ============================================
// Facebook Messenger-এ রিপ্লে পাঠানো
// ============================================
async function sendFacebookReply(recipientId, message) {
  try {
    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );
  } catch (error) {
    console.error("Facebook Send Error:", error);
  }
}

// ============================================
// WhatsApp-এ রিপ্লে পাঠানো
// ============================================
async function sendWhatsAppReply(phoneNumber, message) {
  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        }),
      }
    );
  } catch (error) {
    console.error("WhatsApp Send Error:", error);
  }
}

// ============================================
// মূল Webhook Handler
// ============================================
export default async function handler(req, res) {

  // ---- GET: Webhook Verification ----
  if (req.method === "GET") {
    const mode      = req.query["hub.mode"];
    const token     = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified!");
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // ---- POST: মেসেজ আসলে প্রসেস করা ----
  if (req.method === "POST") {
    const body = req.body;

    // আগে 200 দিয়ে দিই যাতে Meta timeout না করে
    res.status(200).send("EVENT_RECEIVED");

    try {
      // ---- Facebook Messenger ----
      if (body.object === "page") {
        for (const entry of body.entry || []) {
          for (const event of entry.messaging || []) {
            // শুধু টেক্সট মেসেজ হ্যান্ডেল করবে
            if (event.message && event.message.text && !event.message.is_echo) {
              const senderId = event.sender.id;
              const userText = event.message.text;
              console.log(`📘 Facebook: ${userText}`);
              const aiReply = await getAIReply(userText);
              await sendFacebookReply(senderId, aiReply);
            }
          }
        }
      }

      // ---- WhatsApp ----
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            const messages = change.value?.messages;
            if (messages) {
              for (const msg of messages) {
                if (msg.type === "text") {
                  const phoneNumber = msg.from;
                  const userText    = msg.text.body;
                  console.log(`💬 WhatsApp: ${userText}`);
                  const aiReply = await getAIReply(userText);
                  await sendWhatsAppReply(phoneNumber, aiReply);
                }
              }
            }
          }
        }
      }

    } catch (error) {
      console.error("Webhook Error:", error);
    }

    return;
  }

  res.status(405).send("Method Not Allowed");
}
