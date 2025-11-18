// /project/workspace/models/subscription.js

const mongoose = require('mongoose'); // FIX: Обязательно подключаем mongoose

// --- 1. ОПРЕДЕЛЕНИЕ СХЕМЫ ---
const subscriptionSchema = new mongoose.Schema({
    chatId: {
        type: Number,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: false,
    },
    location: {
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
    },
    notificationTime: {
        type: String, // Например, "09:30"
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

// --- 2. СОЗДАНИЕ МОДЕЛИ ---
const Subscription = mongoose.model("Subscription", subscriptionSchema);

// --- 3. ЭКСПОРТ МОДУЛЯ ---
module.exports = Subscription;