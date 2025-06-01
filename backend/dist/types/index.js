"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserType = exports.PaymentStatus = exports.BidStatus = exports.TaskStatus = exports.TaskCategory = void 0;
var TaskCategory;
(function (TaskCategory) {
    TaskCategory["HOUSEHOLD"] = "household";
    TaskCategory["TECH"] = "tech";
    TaskCategory["TRANSPORTATION"] = "transportation";
    TaskCategory["REPAIRS"] = "repairs";
    TaskCategory["CLEANING"] = "cleaning";
    TaskCategory["GARDENING"] = "gardening";
    TaskCategory["MOVING"] = "moving";
    TaskCategory["HANDYMAN"] = "handyman";
    TaskCategory["OTHER"] = "other";
})(TaskCategory || (exports.TaskCategory = TaskCategory = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["OPEN"] = "open";
    TaskStatus["ASSIGNED"] = "assigned";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var BidStatus;
(function (BidStatus) {
    BidStatus["PENDING"] = "pending";
    BidStatus["ACCEPTED"] = "accepted";
    BidStatus["REJECTED"] = "rejected";
    BidStatus["WITHDRAWN"] = "withdrawn";
})(BidStatus || (exports.BidStatus = BidStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var UserType;
(function (UserType) {
    UserType["CLIENT"] = "client";
    UserType["TASKER"] = "tasker";
})(UserType || (exports.UserType = UserType = {}));
//# sourceMappingURL=index.js.map