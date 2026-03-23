/* eslint-disable unicorn/prefer-top-level-await */
'use strict';
require('dotenv').config();
const PaymentService = require('./src/services/payment.service');
const { pool } = require('./src/config/database');

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
    try {
        console.log('Testing expirePayments...');
        const result = await PaymentService.expirePayments();
        console.log('Success:', result);
    } catch (e) {
        console.error('Error:', e.stack || e);
    } finally {
        await pool.end();
    }
})();
