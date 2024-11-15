import { ErrorRequestHandler } from "express";
import * as yup from "yup";

export const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (error instanceof yup.ValidationError) {
        // Handle Yup validation errors
        res.status(400).json({ message: error.errors[0] });
        return
    }

    // Handle other types of errors
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An unexpected error occurred." });
}