'use strict';

const { z } = require('zod');

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    FRONTEND_URL: z.string().default('http://localhost:5173'),

    // Database (Supabase DATABASE_URL takes priority over individual vars)
    DATABASE_URL: z.string().optional(),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().default('nimbuscart'),
    DB_USER: z.string().default('nimbuscart_user'),
    DB_PASSWORD: z.string().default(''),
    DB_SSL: z.string().default('false'),
    DB_POOL_MIN: z.coerce.number().default(2),
    DB_POOL_MAX: z.coerce.number().default(20),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_TLS: z.string().default('false'),

    // JWT
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // UPI Payment
    UPI_MERCHANT_VPA: z.string().default('merchant@upi'),
    UPI_MERCHANT_NAME: z.string().default('NimbusCart'),
    BANK_WEBHOOK_SECRET: z.string().default('dev-webhook-secret'),
    BANK_WEBHOOK_ALLOWED_IPS: z.string().optional(),

    // Payment
    PAYMENT_TIMEOUT_SECONDS: z.coerce.number().default(300),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

let env;
try {
    env = envSchema.parse(process.env);
} catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error.flatten?.().fieldErrors || error.message);
    process.exit(1);
}

module.exports = env;
