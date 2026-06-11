import crypto from "crypto";
import UsersModel from "../models/usersModel";
import bcrypt from "bcryptjs";
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConfirmResetCodeRequest {
  email?: string;
  code?: string;
  password?: string;
}

export default class ResetPasswordService {
  async resetPassword(userData: any): Promise<ServiceResponse<any>> {
    try {
      if (!userData.email || typeof userData.email !== "string") {
        return {
          success: false,
          error: "Email is required",
        };
      }

      const email = userData.email.trim().toLowerCase();
      const user = await UsersModel.findOne({
        email,
      });

      if (!user) {
        return {
          success: true,
          data: {
            message: "If an account exists, a reset code has been generated.",
          },
        };
      }

      const resetCode = crypto.randomInt(100000, 1000000).toString();

      user.code = resetCode;
      user.codeExpires = new Date(Date.now() + 15 * 60 * 1000);

      await user.save();

      console.log(`
Email: ${user.email}
Reset Code: ${resetCode}
Expires In: 15 Minutes
`);

      return {
        success: true,
        data: {
          message: "Reset code generated successfully.",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Internal server error",
      };
    }
  }

  async confirmPassword(
    userData: ConfirmResetCodeRequest,
  ): Promise<ServiceResponse<any>> {
    try {
      if (!userData.email?.trim()) {
        return {
          success: false,
          error: "Email is required",
        };
      }

      if (!userData.code?.trim()) {
        return {
          success: false,
          error: "Reset code is required",
        };
      }

      if (!userData.password?.trim()) {
        return {
          success: false,
          error: "New password is required",
        };
      }

      const email = userData.email.trim().toLowerCase();

      const user = await UsersModel.findOne({ email });

      if (!user) {
        return {
          success: false,
          error: "Invalid or expired reset code",
        };
      }

      if (!user.code || !user.codeExpires) {
        return {
          success: false,
          error: "Invalid or expired reset code",
        };
      }

      const isCodeValid = userData.code === user.code;
      const isCodeExpired = new Date() > new Date(user.codeExpires);

      if (!isCodeValid || isCodeExpired) {
        return {
          success: false,
          error: "Invalid or expired reset code",
        };
      }

      user.code = "";
      user.codeExpires = null;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      user.password = hashedPassword;
      user.isverified = true;

      await user.save();

      return {
        success: true,
        data: {
          message: "Code verified successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Internal server error",
      };
    }
  }
}
