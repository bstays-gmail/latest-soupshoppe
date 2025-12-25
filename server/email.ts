import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    replyTo: data.email,
    subject: `[Soup Shoppe Contact] ${data.subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <h3>Message:</h3>
      <p>${data.message.replace(/\n/g, "<br>")}</p>
    `,
    text: `
New Contact Form Submission
----------------------------
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendCateringEmail(data: CateringEmailData): Promise<void> {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    replyTo: data.email,
    subject: `[Soup Shoppe Catering] Request from ${data.fullName}`,
    html: `
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
    `,
    text: `
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
    `,
  };

  await transporter.sendMail(mailOptions);
}
