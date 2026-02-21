'use strict';

const cron = require('node-cron');
const PaymentService = require('../services/payment.service');
const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Initialize all cron jobs.
 */
function initCronJobs() {
    // Expire unpaid payments — every minute
    cron.schedule('* * * * *', async () => {
        try {
            const result = await PaymentService.expirePayments();
            if (result.expired > 0) {
                logger.info(`Cron: expired ${result.expired} payments`);
            }
        } catch (error) {
            logger.error('Cron: expire payments failed', { error: error.message });
        }
    });

    // Clean up stale cart items older than 7 days — daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            const result = await query(
                `DELETE FROM cart_items WHERE updated_at < NOW() - INTERVAL '7 days'`
            );
            if (result.rowCount > 0) {
                logger.info(`Cron: cleaned ${result.rowCount} stale cart items`);
            }
        } catch (error) {
            logger.error('Cron: cart cleanup failed', { error: error.message });
        }
    });

    logger.info('Cron jobs initialized');
}

module.exports = { initCronJobs };
