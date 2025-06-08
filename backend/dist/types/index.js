"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserType = exports.PaymentStatus = exports.BidStatus = exports.TaskStatus = exports.LocationType = exports.TimeOfDay = exports.TimingType = exports.TaskCategory = void 0;
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
var TimingType;
(function (TimingType) {
    TimingType["ON_DATE"] = "on_date";
    TimingType["BEFORE_DATE"] = "before_date";
    TimingType["FLEXIBLE"] = "flexible";
})(TimingType || (exports.TimingType = TimingType = {}));
var TimeOfDay;
(function (TimeOfDay) {
    TimeOfDay["MORNING"] = "morning";
    TimeOfDay["MIDDAY"] = "midday";
    TimeOfDay["AFTERNOON"] = "afternoon";
    TimeOfDay["EVENING"] = "evening";
})(TimeOfDay || (exports.TimeOfDay = TimeOfDay = {}));
var LocationType;
(function (LocationType) {
    LocationType["IN_PERSON"] = "in_person";
    LocationType["ONLINE"] = "online";
})(LocationType || (exports.LocationType = LocationType = {}));
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