import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRouter from "./routes/authRoutes";
import productsRoutes from "./routes/productsRoutes";
import ordersRoutes from "./routes/ordersRoutes";
import resetPasswordRoutes from "./routes/resetPasswordRoutes";
import cors from "cors";

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Routes
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is running",
  });
});
app.use("/auth", authRouter);

app.use("/products", productsRoutes);
app.use("/orders", ordersRoutes);
app.use("/reset-password", resetPasswordRoutes);

// Start server
async function startServer() {
  // Connect DB if configured, but always start the server.
  try {
    await connectDB();
  } catch (err) {
    console.warn("Continuing without DB connection.", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
