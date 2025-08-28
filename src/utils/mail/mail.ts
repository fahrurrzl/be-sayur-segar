import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import env from "../env";

const transporter = nodemailer.createTransport({
  service: env.EMAIL_SMTP_SERVICE_NAME,
  host: env.EMAIL_SMTP_HOST,
  port: env.EMAIL_SMTP_PORT,
  secure: env.EMAIL_SMTP_SECURE,
  auth: {
    user: env.EMAIL_SMTP_USER,
    pass: env.EMAIL_SMTP_PASS,
  },
  requireTLS: true,
});

export interface ISendMail {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const sendMail = async ({ from, to, subject, html }: ISendMail) => {
  return await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
};

const renderMailHtml = async (template: string, data: any) => {
  return await ejs.renderFile(
    path.join(__dirname, `templates/${template}`),
    data
  );
};

export { sendMail, renderMailHtml };
