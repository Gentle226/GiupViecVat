import mongoose, { Document } from 'mongoose';
export { User, IUser } from './User';
export { Task, ITask } from './Task';
export { Bid, IBid } from './Bid';
export { Message, Conversation, IMessage, IConversation } from './Message';
export interface IReview extends Document {
    taskId: mongoose.Types.ObjectId;
    reviewerId: mongoose.Types.ObjectId;
    revieweeId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
}
export interface IPayment extends Document {
    taskId: mongoose.Types.ObjectId;
    payerId: mongoose.Types.ObjectId;
    payeeId: mongoose.Types.ObjectId;
    amount: number;
    status: string;
    stripePaymentIntentId: string;
    createdAt: Date;
    completedAt?: Date;
}
export declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}> & IReview & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}> & IPayment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=index.d.ts.map