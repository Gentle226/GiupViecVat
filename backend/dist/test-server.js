"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.get("/", (req, res) => {
    res.json({ message: "Server is working!" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
//# sourceMappingURL=test-server.js.map