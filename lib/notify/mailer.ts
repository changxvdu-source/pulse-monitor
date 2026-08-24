export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type Mailer = {
  send(message: MailMessage): Promise<void>;
};

export type RecordingMailer = Mailer & {
  sent: MailMessage[];
};

export function createRecordingMailer(): RecordingMailer {
  const sent: MailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

export function createConsoleMailer(): Mailer {
  return {
    async send(message) {
      console.log("[pulse-mail] to=", message.to);
      console.log("[pulse-mail] subject=", message.subject);
      console.log(message.text);
    },
  };
}

export function createResendMailer(options: {
  apiKey: string;
  from: string;
}): Mailer {
  return {
    async send(message) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`mail_failed: ${response.status} ${body}`);
      }
    },
  };
}

export function createConfiguredMailer(): Mailer {
  const driver = process.env.MAIL_DRIVER?.trim() || "console";
  if (driver === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.warn("[pulse-mail] RESEND_API_KEY missing; using console mailer");
      return createConsoleMailer();
    }
    return createResendMailer({
      apiKey,
      from: process.env.RESEND_FROM?.trim() || "Pulse <onboarding@resend.dev>",
    });
  }
  return createConsoleMailer();
}
