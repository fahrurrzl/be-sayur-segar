import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};
