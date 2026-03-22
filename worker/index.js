/**
 * Sky Automated — AI Chat Worker
 * Cloudflare Worker that proxies chat messages to OpenAI GPT-4o-mini
 * with a system prompt trained on Sky Automated's services.
 */

const SYSTEM_PROMPT = `You are Sky, the friendly AI assistant for Sky Automated — an AI automation and web design agency that helps local businesses grow.

ABOUT SKY AUTOMATED:
- We build custom websites and intelligent automation systems for local businesses
- Target clients: contractors, restaurants, salons & spas, auto repair, health & wellness, retail stores
- We deliver in 2 weeks, no long-term contracts, cancel-anytime monthly plans
- Based in the US, serving businesses nationwide

OUR SERVICES:
1. Professional Website — custom-designed, mobile-first, SEO-optimized, fast-loading
2. AI Chat Assistant — chatbot trained on your business, answers FAQs, captures leads, books appointments 24/7
3. Automated Email & SMS — follow-up sequences, appointment reminders, re-engagement campaigns
4. Appointment Booking — online scheduling synced to your calendar, automatic confirmations
5. Lead Capture & CRM — smart forms, automatic lead scoring, pipeline tracking
6. Social Media Automation — scheduled posting, content calendar, performance analytics

PRICING:
- Starter: $1,500 one-time setup + $199/mo — professional website, lead capture forms, SEO, hosting & SSL, monthly analytics
- Growth (Most Popular): $3,000 one-time setup + $399/mo — everything in Starter + AI Chat Assistant, automated email follow-ups, appointment booking, CRM & pipeline tracking, priority support, SMS automation
- Full Auto: $5,000 one-time setup + $699/mo — everything in Growth + social media automation, monthly performance reports, dedicated account manager, quarterly strategy reviews, custom integrations

KEY SELLING POINTS:
- 2-week delivery guarantee
- No long-term contracts — cancel anytime
- 100% done-for-you — we handle everything
- 30 days support included
- Free consultation to start

COMMON QUESTIONS:
Q: How long does it take?
A: Most projects are live within 2 weeks. After our discovery call, we build, you review, and we launch.

Q: Do I need technical knowledge?
A: Not at all. We handle everything — design, development, hosting, and ongoing maintenance.

Q: What if I already have a website?
A: We can rebuild it from scratch or add automation on top of what you have. We assess your current site and recommend the best path.

Q: Are there contracts?
A: No contracts. Monthly plans are cancel-anytime. We keep clients by delivering results, not by locking them in.

Q: What does the monthly fee cover?
A: Hosting, maintenance, updates, automation monitoring, and support. Your website stays fast, secure, and up-to-date.

Q: How do I get started?
A: Book a free consultation — we meet virtually or in person, learn about your business, and show you exactly where automation can save time and capture more leads. No pressure, no obligation.

YOUR ROLE:
- Be warm, friendly, and conversational — like talking to a knowledgeable friend, not a salesperson
- Answer questions about services, pricing, and process clearly
- Help visitors understand which plan is right for their business
- After 2-3 exchanges, naturally ask for their name and email so the team can follow up personally. Example: "By the way, I'd love to have someone from our team reach out to you personally — what's your name and best email?"
- Once they share their name/email, confirm it warmly and let them know the team will be in touch soon
- Keep responses concise — 2-4 sentences max unless they ask for detail
- Never make up information not listed above
- If asked something you don't know, say you'll have the team follow up

LEAD CAPTURE SIGNAL:
When the user provides their email address, include this exact tag at the END of your response (hidden from display): [LEAD_CAPTURED]`;

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages } = await request.json();

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Limit conversation history to last 10 messages to control costs
      const recentMessages = messages.slice(-10);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...recentMessages,
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('OpenAI error:', err);
        return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      let reply = data.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again or contact us directly!";

      // Detect lead capture signal and extract email from conversation
      let leadCaptured = false;
      if (reply.includes('[LEAD_CAPTURED]')) {
        reply = reply.replace('[LEAD_CAPTURED]', '').trim();
        leadCaptured = true;

        // Extract email from recent messages
        const allText = [...recentMessages, { role: 'assistant', content: reply }]
          .map(m => m.content).join(' ');
        const emailMatch = allText.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
        const nameMatch = allText.match(/(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);

        if (emailMatch) {
          // Fire and forget — send lead to Formspree
          fetch('https://formspree.io/f/mojkrakr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailMatch[0],
              name: nameMatch ? nameMatch[1] : 'Chat Lead',
              message: `New chat lead captured!\n\nEmail: ${emailMatch[0]}\nName: ${nameMatch ? nameMatch[1] : 'Not provided'}\n\nConversation summary:\n${recentMessages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}`,
              _subject: `New Chat Lead: ${nameMatch ? nameMatch[1] : emailMatch[0]}`,
            }),
          }).catch(() => {}); // silent fail
        }
      }

      return new Response(JSON.stringify({ reply, leadCaptured }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
