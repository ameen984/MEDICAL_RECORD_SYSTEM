import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types.ts'; // We'll define types later

export interface AuthState {
    user: User | null;
    token: string | null;
    activeHospitalId: string | null;
}

const initialState: AuthState = {
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    token: localStorage.getItem('token') || null,
    activeHospitalId: localStorage.getItem('activeHospitalId') || null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string }>
        ) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;

            // Helper: extract a string ID from a populated object or raw string
            const extractId = (entry: string | any): string | null => {
                if (!entry) return null;
                if (typeof entry === 'string') return entry || null;
                const id = entry._id || entry.id;
                return typeof id === 'string' && id ? id : null;
            };

            // Auto default active context if doctor/admin
            let activeId: string | null = null;
            if (user.hospitalIds && user.hospitalIds.length > 0) {
                activeId = extractId(user.hospitalIds[0]);
            }

            if (typeof activeId !== 'string' || !activeId) {
                if (activeId !== null) {
                    console.warn('[authSlice] Hospital ID extraction yielded a non-string value; defaulting to null.', activeId);
                }
                activeId = null;
            }

            // Preserve if already explicitly set and valid
            if (!state.activeHospitalId || (activeId && state.activeHospitalId !== activeId)) {
                state.activeHospitalId = activeId;
                if (activeId) localStorage.setItem('activeHospitalId', activeId);
            }

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
        },
        setActiveHospital: (state, action: PayloadAction<string>) => {
            state.activeHospitalId = action.payload;
            localStorage.setItem('activeHospitalId', action.payload);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.activeHospitalId = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('activeHospitalId');
        },
    },
});

export const { setCredentials, setActiveHospital, logout } = authSlice.actions;
export default authSlice.reducer;
