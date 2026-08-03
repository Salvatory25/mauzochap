// Mock Email Service for MauzoChap
import { toast } from "sonner";

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export function sendEmail({ to, subject, body }: EmailOptions) {
  // Format console log elegantly
  console.log(
    `%c[EMAIL SENT] to: ${to}\nSubject: ${subject}\n\n${body}`,
    "background: #1e293b; color: #38bdf8; font-weight: bold; padding: 4px; border-radius: 4px;"
  );
  
  // Show notification toast in the app indicating an email was dispatched
  toast.info(`Mock email sent to ${to}: ${subject}`, {
    duration: 5000,
  });
}
