export declare class DatabaseAdapter {
    private useMemoryStore;
    initialize(): Promise<void>;
    createUser(userData: any): Promise<any>;
    findUserByEmail(email: string): Promise<any>;
    findUserById(id: string): Promise<any>;
    updateUser(id: string, updates: any): Promise<any>;
    createTask(taskData: any): Promise<any>;
    findTasks(filter?: any, options?: any): Promise<{
        tasks: any;
        total: any;
        page: any;
        totalPages: number;
    }>;
    findTaskById(id: string): Promise<any>;
    updateTask(id: string, updates: any): Promise<any>;
    createBid(bidData: any): Promise<any>;
    findBidsByTask(taskId: string): Promise<any>;
    findBidById(id: string): Promise<any>;
    updateBid(id: string, updates: any): Promise<any>;
    createMessage(messageData: any): Promise<any>;
    findMessagesByConversation(conversationId: string): Promise<any>;
    createConversation(conversationData: any): Promise<any>;
    findConversationsByUser(userId: string): Promise<any>;
    findConversationById(id: string): Promise<any>;
    createReview(reviewData: any): Promise<any>;
    findReviewsByUser(userId: string): Promise<any>;
    createPayment(paymentData: any): Promise<any>;
    findPaymentsByTask(taskId: string): Promise<any>;
}
export declare const db: DatabaseAdapter;
//# sourceMappingURL=adapter.d.ts.map