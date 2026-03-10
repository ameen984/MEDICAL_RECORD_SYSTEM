import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
    success: false;
    message: string;
    stack?: string;
}

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for dev
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Resource not found';
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        error.message = `An account with that ${field} already exists`;
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((val: any) => val.message)
            .join(', ');
        error.message = message;
        error.statusCode = 400;
    }

    // JWT expired
    if (err.name === 'TokenExpiredError') {
        error.message = 'Session expired, please log in again';
        error.statusCode = 401;
    }

    // JWT invalid/malformed
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid session token, please log in again';
        error.statusCode = 401;
    }

    // Multer file too large
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = 'File too large. Maximum allowed size is 10MB';
        error.statusCode = 400;
    }

    // Multer unexpected field
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error.message = 'Unexpected file upload field';
        error.statusCode = 400;
    }

    const response: ErrorResponse = {
        success: false,
        message: error.message || 'Server Error',
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(error.statusCode || 500).json(response);
};
