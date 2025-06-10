import mongoose, { Document } from 'mongoose';
export interface IBid extends Document {
    taskId: mongoose.Types.ObjectId;
    bidderId: mongoose.Types.ObjectId;
    amount: number;
    message: string;
    estimatedDuration: number;
    status: string;
    createdAt: Date;
}
export declare const Bid: mongoose.Model<IBid, {}, {}, {}, mongoose.Document<unknown, {}, IBid, {}> & IBid & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Bid.d.ts.map