import { Request, Response } from "express";
import { prisma } from "../../prisma/prisma";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "../schema/auth.schema";
import { IReqUser, TLogin, TRegister } from "../types/auth";
import { z } from "zod";
import { generateToken } from "../utils/jwt";

export default {
  async register(req: Request, res: Response) {
    const { name, email, address, phone, password, confirmPassword } =
      req.body as unknown as TRegister;

    try {
      const validated = registerSchema.parse({
        name,
        email,
        address,
        phone,
        password,
        confirmPassword,
      });

      const userExists = await prisma.user.findFirst({
        where: {
          email: validated.email,
        },
      });

      if (userExists) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(validated.password, 10);

      const user = await prisma.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
          password: hashedPassword,
          address: validated.address,
        },
      });

      return res.status(201).json({
        message: "User created successfully",
        data: user,
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
  async login(req: Request, res: Response) {
    const { email, password } = req.body as unknown as TLogin;

    try {
      const validated = loginSchema.parse({
        email,
        password,
      });

      const userExists = await prisma.user.findFirst({
        where: {
          email: validated.email,
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
      });

      if (!userExists) {
        return res.status(400).json({
          message: "User not match in our record",
        });
      }

      return res.status(200).json({
        message: "Success get user detail",
        data: userExists,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
