'use strict';

const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

/**
 * Initialize Socket.IO WebSocket server.
 */
const initWebSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.on('connection', (socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        // Join a room for user-specific events
        socket.on('join:order', (orderId) => {
            socket.join(`order:${orderId}`);
            logger.debug(`Socket ${socket.id} joined order:${orderId}`);
        });

        socket.on('join:user', (userId) => {
            socket.join(`user:${userId}`);
            logger.debug(`Socket ${socket.id} joined user:${userId}`);
        });

        socket.on('disconnect', (reason) => {
            logger.debug('WebSocket client disconnected', { socketId: socket.id, reason });
        });
    });

    logger.info('WebSocket server initialized');
    return io;
};

/**
 * Get the Socket.IO instance.
 */
const getIO = () => {
    if (!io) {
        throw new Error('WebSocket not initialized. Call initWebSocket first.');
    }
    return io;
};

/**
 * Emit a payment status update to the order room.
 */
const emitPaymentUpdate = (orderId, data) => {
    if (io) {
        io.to(`order:${orderId}`).emit('payment:update', data);
        logger.info('Payment update emitted', { orderId, status: data.status });
    }
};

module.exports = { initWebSocket, getIO, emitPaymentUpdate };
