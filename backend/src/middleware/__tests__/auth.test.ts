import { Request, Response, NextFunction } from 'express';
import { authorize, enforceHospitalScope, AuthRequest } from '../auth';

describe('Auth Middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });

    describe('authorize', () => {
        test('should allow access if user has required role', () => {
            mockRequest = { user: { role: 'super_admin' } as any };
            const authMiddleware = authorize('super_admin', 'admin');

            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        test('should deny access if user does not have required role', () => {
            mockRequest = { user: { role: 'doctor' } as any };
            const authMiddleware = authorize('admin');

            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });

    describe('enforceHospitalScope', () => {
        test('should skip scope enforcement for super_admin', () => {
            mockRequest = {
                user: { role: 'super_admin', hospitalId: 'hosp123' } as any,
                body: { hospitalId: 'hosp999' },
                query: {}
            };

            enforceHospitalScope(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.body.hospitalId).toBe('hosp999'); // Payload should be untouched
        });

        test('should aggressively rewrite body hospitalId for standard admin', () => {
            mockRequest = {
                user: { role: 'admin', hospitalId: 'hosp123' } as any,
                body: { hospitalId: 'hosp999' },
                query: {}
            };

            enforceHospitalScope(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.body.hospitalId).toBe('hosp123'); // Implicitly forces to admin's own hospital
        });

        test('should aggressively rewrite query hospitalId for standard admin', () => {
            mockRequest = {
                user: { role: 'admin', hospitalId: 'hosp123' } as any,
                body: {},
                query: { hospitalId: 'hosp999' }
            };

            enforceHospitalScope(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.query!.hospitalId).toBe('hosp123');
        });
    });
});
