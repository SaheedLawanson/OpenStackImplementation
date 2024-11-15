import 'dotenv/config'
import express from "express";
import userRouter from "./provider";
import { globalErrorHandler } from "./errorHandlers";

const app = express();
const PORT = 3000;

// Global Error Handler

app.use(express.json());
app.use("/provider", userRouter);
app.use(globalErrorHandler);

app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));
