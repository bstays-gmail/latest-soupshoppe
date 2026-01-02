interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface CateringEmailData {
  fullName: string;
  email: string;
  phone: string;
  eventDate: string;
  guestCount: string;
  eventType: string;
  menuPreferences: string;
  additionalInfo: string;
}

async function sendEmailViaResend(to: string, subject: string, html: string, text: string, replyTo?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Soup Shoppe <onboarding@resend.dev>",
      to: [to],
      reply_to: replyTo,
      subject: subject,
      html: html,
      text: text,
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error("Resend API error:", result);
    throw new Error(result.message || "Failed to send email via Resend");
  }
  
  console.log("Email sent successfully via Resend:", result.id);
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  console.log("Sending contact email via Resend to bstays@gmail.com");
  
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <h3>Message:</h3>
    <p>${data.message.replace(/\n/g, "<br>")}</p>
  `;
  
  const text = `
New Contact Form Submission
----------------------------
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
  `;

  await sendEmailViaResend(
    "bstays@gmail.com",
    `[Soup Shoppe Contact] ${data.subject}`,
    html,
    text,
    data.email
  );
}

export async function sendCateringEmail(data: CateringEmailData): Promise<void> {
  console.log("Sending catering email via Resend to bstays@gmail.com");
  
  const html = `
    <h2>New Catering Request</h2>
    <p><strong>Name:</strong> ${data.fullName}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Phone:</strong> ${data.phone}</p>
    <p><strong>Event Date:</strong> ${data.eventDate}</p>
    <p><strong>Guest Count:</strong> ${data.guestCount}</p>
    <p><strong>Event Type:</strong> ${data.eventType}</p>
    <h3>Menu Preferences:</h3>
    <p>${data.menuPreferences ? data.menuPreferences.replace(/\n/g, "<br>") : "Not specified"}</p>
    <h3>Additional Information:</h3>
    <p>${data.additionalInfo ? data.additionalInfo.replace(/\n/g, "<br>") : "None provided"}</p>
  `;
  
  const text = `
New Catering Request
--------------------
Name: ${data.fullName}
Email: ${data.email}
Phone: ${data.phone}
Event Date: ${data.eventDate}
Guest Count: ${data.guestCount}
Event Type: ${data.eventType}

Menu Preferences:
${data.menuPreferences || "Not specified"}

Additional Information:
${data.additionalInfo || "None provided"}
  `;

  await sendEmailViaResend(
    "bstays@gmail.com",
    `[Soup Shoppe Catering] Request from ${data.fullName}`,
    html,
    text,
    data.email
  );
}
