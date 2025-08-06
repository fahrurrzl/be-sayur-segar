import { Response } from "express";
import { IReqUser } from "../types/auth";
import { deleteImage, uploadImage } from "../utils/cloudinary";

export default {
  async upload(req: IReqUser, res: Response) {
    if (!req.file) {
      return res.status(400).json({
        message: "File is not exist",
        data: null,
      });
    }

    try {
      const result = await uploadImage(req.file);
      res.status(200).json({
        message: "Success upload image",
        data: result,
      });
    } catch (error) {
      console.log("error => ", error);
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
  async delete(req: IReqUser, res: Response) {
    try {
      const { fileUrl } = req.body as { fileUrl: string };

      const result = await deleteImage(fileUrl);
      res.status(200).json({
        message: "Success delete image",
        data: result,
      });
    } catch (error) {
      console.log("error => ", error);
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
};
