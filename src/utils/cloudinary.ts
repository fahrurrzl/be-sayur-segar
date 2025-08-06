import { v2 as cloudinary } from "cloudinary";
import env from "./env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const toDataUrl = (file: Express.Multer.File) => {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataUrl = `data:${file.mimetype};base64,${b64}`;
  return dataUrl;
};

const getPublicUrl = (fileUrl: string) => {
  const fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
  const publicId = fileName.substring(0, fileName.lastIndexOf("."));
  return publicId;
};

export const uploadImage = async (file: Express.Multer.File) => {
  const dataUrl = toDataUrl(file);
  const result = await cloudinary.uploader.upload(dataUrl, {
    resource_type: "auto",
    folder: "sayur-segar",
  });
  return result;
};

export const deleteImage = async (fileUrl: string) => {
  const publicId = getPublicUrl(fileUrl);
  const result = await cloudinary.uploader.destroy(`sayur-segar/${publicId}`);
  return result;
};
