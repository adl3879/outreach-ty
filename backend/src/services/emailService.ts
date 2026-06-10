import nodemailer from "nodemailer";
import prisma from "../prisma";

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function renderTemplate(
  template: string,
  lead: Record<string, string | null>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return (lead[key] as string) ?? `{{${key}}}`;
  });
}

export interface PreviewResult {
  subject: string;
  body: string;
}

export async function previewEmail(leadId: string): Promise<PreviewResult> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const template = await prisma.template.findUnique({
    where: { businessType: lead.businessType },
  });

  if (!template) throw new Error(`No template for business type: ${lead.businessType}`);

  const vars: Record<string, string | null> = {
    businessName: lead.name,
    businessType: lead.businessType,
    businessAddress: lead.address,
    businessPhone: lead.phone,
    senderName: process.env.SENDER_NAME ?? "",
    senderPhone: process.env.SENDER_PHONE ?? "",
    senderEmail: process.env.GMAIL_USER ?? "",
    senderPortfolio: process.env.SENDER_PORTFOLIO ?? "",
  };

  return {
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
  };
}

export async function sendEmail(
  leadId: string,
  customBody?: string
): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status !== "APPROVED") throw new Error("Lead must be APPROVED to send email");
  if (!lead.email) throw new Error("Lead has no email address");

  const preview = await previewEmail(leadId);
  const body = customBody ?? preview.body;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.SENDER_NAME}" <${process.env.GMAIL_USER}>`,
    to: lead.email,
    subject: preview.subject,
    text: body,
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "EMAILED", emailSentAt: new Date() },
  });
}
