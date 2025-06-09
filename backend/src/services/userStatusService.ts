// Service to track online/offline user status
class UserStatusService {
  private onlineUsers: Set<string> = new Set();
  private userLastSeen: Map<string, Date> = new Map();

  // Mark user as online
  setUserOnline(userId: string): void {
    this.onlineUsers.add(userId);
    this.userLastSeen.set(userId, new Date());
  }

  // Mark user as offline
  setUserOffline(userId: string): void {
    this.onlineUsers.delete(userId);
    this.userLastSeen.set(userId, new Date());
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  // Get all online users
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers);
  }

  // Get online status for multiple users
  getUsersStatus(userIds: string[]): {
    [userId: string]: { isOnline: boolean; lastSeen?: Date };
  } {
    const result: { [userId: string]: { isOnline: boolean; lastSeen?: Date } } =
      {};

    userIds.forEach((userId) => {
      result[userId] = {
        isOnline: this.isUserOnline(userId),
        lastSeen: this.userLastSeen.get(userId),
      };
    });

    return result;
  }

  // Get last seen time for a user
  getLastSeen(userId: string): Date | undefined {
    return this.userLastSeen.get(userId);
  }

  // Get count of online users
  getOnlineCount(): number {
    return this.onlineUsers.size;
  }

  // Clean up old offline users (optional, for memory management)
  cleanupOldEntries(olderThanHours = 24): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    for (const [userId, lastSeen] of this.userLastSeen.entries()) {
      if (lastSeen < cutoff && !this.onlineUsers.has(userId)) {
        this.userLastSeen.delete(userId);
      }
    }
  }
}

// Export singleton instance
export const userStatusService = new UserStatusService();
