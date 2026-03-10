import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenBlacklist extends Document {
    token: string;
    expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
    token: { type: String, required: true, unique: true, index: true },
    // TTL index — MongoDB auto-deletes expired documents so the collection stays lean
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export default mongoose.model<ITokenBlacklist>('TokenBlacklist', TokenBlacklistSchema);
