import { Request, Response } from "express";
import { prisma } from "../../prisma/prisma";
import bcrypt from "bcryptjs";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateSchema,
} from "../schema/auth.schema";
import {
  IReqUser,
  TChangePassword,
  TLogin,
  TRegister,
  TUpdate,
} from "../types/auth";
import { z } from "zod";
import { generateToken } from "../utils/jwt";
import { renderMailHtml, sendMail } from "../utils/mail/mail";
import env from "../utils/env";

export default {
  async register(req: Request, res: Response) {
    const { name, username, email, address, phone, password, confirmPassword } =
      req.body as unknown as TRegister;

    try {
      const validated = registerSchema.parse({
        name,
        username,
        email,
        address,
        phone,
        password,
        confirmPassword,
      });

      const userExists = await prisma.user.findFirst({
        where: {
          OR: [
            {
              email: validated.email,
            },
            {
              username: validated.username,
            },
          ],
        },
      });

      if (userExists) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(validated.password, 10);
      const activationCode = await bcrypt.hash(validated.email, 10);

      const user = await prisma.user.create({
        data: {
          name: validated.name,
          username: validated.username,
          email: validated.email,
          phone: validated.phone,
          password: hashedPassword,
          address: validated.address,
          activationCode,
        },
      });

      // mail
      const contentMail = await renderMailHtml("registration-success.ejs", {
        name: user?.name,
        email: user?.email,
        createdAt: user?.createdAt,
        activationLink: `${env.FRONTEND_URL}/auth/activation?code=${user.activationCode}`,
      });

      await sendMail({
        from: env.EMAIL_SMTP_USER,
        to: user?.email,
        subject: "Aktivasi akun Anda",
        html: contentMail as string,
      });

      return res.status(201).json({
        message: "User created successfully",
        data: {
          ...user,
          password: undefined,
        },
      });
    } catch (error) {
      console.log(error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      } else {
        return res.status(500).json({
          message: "Internal server error",
        });
      }
    }
  },
  async login(req: Request, res: Response) {
    const { email, password } = req.body as unknown as TLogin;

    try {
      const validated = loginSchema.parse({
        email,
        password,
      });

      const userExists = await prisma.user.findFirst({
        where: {
          AND: [
            {
              email: validated.email,
            },
            {
              isActive: true,
            },
          ],
        },
      });

      if (!userExists) {
        return res.status(400).json({
          message: "User not match in our record",
        });
      }

      const isPasswordMatch = await bcrypt.compare(
        validated.password,
        userExists.password
      );

      if (!isPasswordMatch) {
        return res.status(400).json({
          message: "Email or password is incorrect",
        });
      }

      const token = generateToken({
        id: userExists.id,
        email: userExists.email,
        role: userExists.role,
      });

      res.status(200).json({
        message: "Login success",
        data: token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      } else {
        return res.status(500).json({
          message: "Internal server error",
        });
      }
    }
  },
  async me(req: IReqUser, res: Response) {
    const user = req.user;

    try {
      const userExists = await prisma.user.findFirst({
        where: {
          email: user?.email,
        },
        include: {
          Seller: {
            select: {
              id: true,
              storeName: true,
              storePhoto: true,
              storeLocation: true,
              verified: true,
              bankName: true,
              accountName: true,
              accountNumber: true,
              description: true,
              wallet: true,
            },
          },
        },
      });

      if (!userExists) {
        return res.status(400).json({
          message: "User not match in our record",
        });
      }

      return res.status(200).json({
        message: "Success get user detail",
        data: {
          ...userExists,
          password: undefined,
        },
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async update(req: IReqUser, res: Response) {
    const { name, email, phone, address, username, gender, birthDate, photo } =
      req.body as unknown as TUpdate;
    const user = req?.user;

    try {
      const validated = updateSchema.parse({
        name,
        username,
        email,
        phone,
        address,
        gender,
        birthDate,
        photo,
      });

      const userExists = await prisma.user.findUnique({
        where: {
          id: user?.id,
        },
      });

      if (!userExists) {
        return res.status(400).json({
          message: "User not match in our record",
        });
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: user?.id,
        },
        data: {
          name: validated.name,
          username: validated.username,
          email: validated.email,
          phone: validated.phone,
          address: validated.address,
          gender: validated.gender,
          birthDate: validated.birthDate,
          photo: validated.photo,
        },
      });

      return res.status(200).json({
        message: "User updated successfully",
        data: {
          ...updatedUser,
          password: undefined,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      } else {
        return res.status(500).json({
          message: "Internal server error",
        });
      }
    }
  },
  // login admin
  async loginAdmin(req: Request, res: Response) {
    const { email, password } = req.body as unknown as TLogin;

    try {
      const validated = loginSchema.parse({
        email,
        password,
      });

      const userExists = await prisma.user.findFirst({
        where: {
          email: validated.email,
          OR: [
            {
              role: "admin",
            },
            {
              role: "superadmin",
            },
          ],
        },
      });

      if (!userExists) {
        return res.status(400).json({
          message: "User not match in our record",
        });
      }

      const isPasswordMatch = await bcrypt.compare(
        validated.password,
        userExists.password
      );

      if (!isPasswordMatch) {
        return res.status(400).json({
          message: "Email or password is incorrect",
        });
      }

      const token = generateToken({
        id: userExists.id,
        email: userExists.email,
        role: userExists.role,
      });

      res.status(200).json({
        message: "Login success",
        data: token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      } else {
        return res.status(500).json({
          message: "Internal server error",
        });
      }
    }
  },
  // change password
  async changePassword(req: IReqUser, res: Response) {
    const { oldPassword, newPassword } = req.body as unknown as TChangePassword;
    const user = req?.user;

    try {
      const validated = changePasswordSchema.parse({
        oldPassword,
        newPassword,
      });

      const userExists = await prisma.user.findUnique({
        where: {
          id: user?.id,
        },
      });

      if (!userExists) {
        return res.status(400).json({
          message: "User not match in our record",
        });
      }

      const isPasswordMatch = await bcrypt.compare(
        validated.oldPassword,
        userExists.password
      );

      if (!isPasswordMatch) {
        return res.status(400).json({
          message: "Password lama Anda tidak sesuai",
        });
      }

      const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

      await prisma.user.update({
        where: {
          id: user?.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      } else {
        return res.status(500).json({
          message: "Internal server error",
        });
      }
    }
  },
  async activation(req: IReqUser, res: Response) {
    const { code } = req.body as { code: string };

    try {
      const user = await prisma.user.update({
        where: {
          activationCode: code,
        },
        data: {
          isActive: true,
        },
      });

      return res.status(200).json({
        message: "User activated successfully",
        data: {
          ...user,
          password: undefined,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
