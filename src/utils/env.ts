export default {
  JWT_SECRET: process.env.JWT_SECRET as string,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  XENDIT_SECRET_API_KEY: process.env.XENDIT_SECRET_API_KEY as string,
  FRONTEND_URL: process.env.FRONTEND_URL as string,
  EMAIL_SMTP_PASS: process.env.EMAIL_SMTP_PASS as string,
  EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER as string,
  EMAIL_SMTP_PORT: Number(process.env.EMAIL_SMTP_PORT),
  EMAIL_SMTP_SECURE: Boolean(process.env.EMAIL_SMTP_SECURE) as boolean,
  EMAIL_SMTP_SERVICE_NAME: process.env.EMAIL_SMTP_SERVICE_NAME as string,
  EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST as string,
};
