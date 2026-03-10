import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import TokenBlacklist from '../models/TokenBlacklist';

export interface AuthRequest extends Request {
    user?: IUser;
}

// Protect routes - verify JWT token
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        console.error('AUTH FAIL: No token found. Headers:', req.headers.authorization, req.originalUrl);
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        // Reject blacklisted (logged-out) tokens
        const isBlacklisted = await TokenBlacklist.exists({ token });
        if (isBlacklisted) {
            return res.status(401).json({ success: false, message: 'Token has been invalidated. Please log in again.' });
        }

        const user = await User.findById(decoded.id).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'No user found with this token',
            });
        }

        if (user.isActive === false) {
            console.error(`[AUTH-403-A] User ${user._id} (${user.email}) account is suspended`);
            return res.status(403).json({
                success: false,
                message: 'Account has been suspended by an administrator',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('AUTH FAIL:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};

// Authorize specific roles
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            console.error(`[AUTH-403-B] Role check failed. User role: '${req.user?.role}', Required: [${roles.join(', ')}], Route: ${req.originalUrl}`);
            return res.status(403).json({
                success: false,
                message: `User role '${req.user?.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};

export const admin = authorize('admin');
export const isSuperAdmin = authorize('super_admin');
export const isAdminOrSuperAdmin = authorize('admin', 'super_admin');

// Ensure that regular Admins can only query/mutate data belonging to their own hospital
export const enforceHospitalScope = (req: AuthRequest, res: Response, next: NextFunction) => {
    // If the user isn't logged in, or is missing a role, shouldn't really happen since protect runs first, but safety first
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Super Admins have global scope, doing nothing effectively lets them see everything
    if (req.user.role === 'super_admin') {
        return next();
    }

    // Normal Admins are bound to their facility. 
    if (req.user.role === 'admin') {
        if (!req.user.hospitalIds || req.user.hospitalIds.length === 0) {
            console.error(`[AUTH-403-C] Admin ${req.user._id} (${req.user.email}) has no hospital assigned. Route: ${req.originalUrl}`);
            return res.status(403).json({ success: false, message: 'Admin account has no assigned facility, cannot resolve scope.' });
        }

        const allowedHospitalIds = req.user.hospitalIds.map(id => id.toString());

        // Implicitly scope their read queries
        if (req.query) {
            if (req.query.hospitalId) {
                // If they ask for a specific hospital, ensure they have access to it
                if (!allowedHospitalIds.includes(req.query.hospitalId as string)) {
                    req.query.hospitalId = { $in: allowedHospitalIds } as any;
                }
            } else {
                req.query.hospitalId = { $in: allowedHospitalIds } as any;
            }

            // For querying users filtering by hospitalIds array
            if (req.query.hospitalIds) {
                req.query.hospitalIds = { $in: allowedHospitalIds } as any;
            }
        }

        // Implicitly lock their creation/update payloads
        if (req.body) {
            if (req.body.hospitalId) {
                if (!allowedHospitalIds.includes(req.body.hospitalId)) {
                    console.error(`[AUTH-403-D] Admin ${req.user._id} tried to assign hospitalId '${req.body.hospitalId}' but allowed: [${allowedHospitalIds.join(', ')}]. Route: ${req.originalUrl}`);
                    return res.status(403).json({ success: false, message: 'Not authorized to assign to this facility.' });
                }
            } else if (!req.body.hospitalIds) {
                req.body.hospitalId = allowedHospitalIds[0];
            }

            if (req.body.hospitalIds) {
                const requestedIds = Array.isArray(req.body.hospitalIds) ? req.body.hospitalIds : [req.body.hospitalIds];

                if (req.method === 'PATCH') {
                    // On edit (PATCH), silently filter to only allowed hospitals — prevents 403 if doctor has other-hospital affiliations
                    const filteredIds = requestedIds.filter((id: string) => allowedHospitalIds.includes(id));
                    req.body.hospitalIds = filteredIds.length > 0 ? filteredIds : [allowedHospitalIds[0]];
                    console.log(`[AUTH-SCOPE] PATCH filtered hospitalIds from [${requestedIds.join(', ')}] to [${req.body.hospitalIds.join(', ')}]`);
                } else {
                    // On create (POST), strictly enforce hospital scope
                    const allAllowed = requestedIds.every((id: string) => allowedHospitalIds.includes(id));
                    if (!allAllowed) {
                        console.error(`[AUTH-403-E] Admin ${req.user._id} hospitalIds mismatch on POST. Requested: [${requestedIds.join(', ')}], Allowed: [${allowedHospitalIds.join(', ')}]. Route: ${req.originalUrl}`);
                        return res.status(403).json({ success: false, message: 'Not authorized to assign to one or more facilities.' });
                    }
                }
            } else if (req.url.includes('/users') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                req.body.hospitalIds = [allowedHospitalIds[0]];
            }
        }

        return next();
    }

    // Default passthrough for other roles (doctors, patients) handle their own logic downstream
    next();
};
