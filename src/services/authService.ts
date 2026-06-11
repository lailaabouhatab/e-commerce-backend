import User from "../models/usersModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";

interface RegisterInput {
  fullName?: string;
  email?: string;
  password?: string;
}

export class AuthService {
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  register = async (userData: RegisterInput) => {
    const { fullName, email, password } = userData;

    if (!email || !this.isValidEmail(email)) {
      throw { statusCode: 400, message: "Enter a valid email" };
    }

    if (!password || password.length < 6) {
      throw {
        statusCode: 400,
        message: "Password must be at least 6 characters long",
      };
    }

    if (!fullName || fullName.trim().length === 0) {
      throw { statusCode: 400, message: "Full name is required" };
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw {
        statusCode: 409,
        message: "Email is already registered.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      isverified: false,
    });
//console.log(`New user registered: ${newUser.password}, password: ${password}, hashedPassword: ${hashedPassword}`);
    const userObj = newUser.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return {
      success: true,
      data: userWithoutPassword,
    };
  };

  addAdmin = async (adminData: RegisterInput) => {
    const { fullName, email, password } = adminData;

    if (!email || !this.isValidEmail(email)) {
      throw { statusCode: 400, message: "Enter a valid email" };
    }

    if (!password || password.length < 6) {
      throw {
        statusCode: 400,
        message: "Password must be at least 6 characters long",
      };
    }

    if (!fullName || fullName.trim().length === 0) {
      throw { statusCode: 400, message: "Full name is required" };
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw {
        statusCode: 409,
        message: "Email is already registered.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
      fullName,
      email,
      password: hashedPassword,
      isverified: true,
      role: "admin",
    });

    const userObj = newAdmin.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return {
      success: true,
      data: userWithoutPassword,
    };
  };

  login = async (email: string, password: string) => {
    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return { success: false, error: "User not found" };
      }
     console.log(user.password);

      const valid = await bcrypt.compare(password, user.password);
   //  console.log(valid,user.password);
      if (!valid) {

        return { success: false, error: "Invalid credentials" };
      }
console.log(`Attempting login for email: ${email}`,password);
      const JWT_SECRET = process.env.JWT_SECRET;

      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not set in .env");
      }

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      return {
        success: true,
        token,
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        error: message,
      };
    }
  };
}