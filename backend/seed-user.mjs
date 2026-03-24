import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { pool } = require('./src/config/database');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const products = [
    { name: 'Quantum X Pro Smartphone', description: 'Experience next-gen connectivity with ultra-fast processing and a dynamic pro-grade camera system.', price: 899.99, category: 'Electronics', stock: 120, image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351cb31b?auto=format&fit=crop&q=80&w=800', rating: 4.8 },
    { name: 'AeroNoise Cancelling Headphones', description: 'Immersive audio with industry-leading noise cancellation and 40-hour battery life.', price: 249.99, category: 'Electronics', stock: 85, image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800', rating: 4.7 },
    { name: 'Lumina 4K Ultra Smart TV 55"', description: 'Breathtaking 4K clarity, vibrant colors, and built-in smart assistant for seamless streaming.', price: 599, category: 'Electronics', stock: 40, image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800', rating: 4.6 },
    { name: 'TitanBook Pro 16 Laptop', description: 'Powerful companion for creators with an M-class chip, stunning Retina display, and all-day battery.', price: 1299.5, category: 'Electronics', stock: 35, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800', rating: 4.9 },
    { name: 'Apex Smartwatch Series 8', description: 'Health tracking, cellular connectivity, and a durable aerospace-grade titanium case.', price: 399.99, category: 'Electronics', stock: 150, image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800', rating: 4.5 },
    { name: 'Classic Oxford Cotton Shirt', description: 'Breathable, wrinkle-resistant classic fit shirt perfect for the office or a casual evening.', price: 45, category: 'Fashion', stock: 200, image_url: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e32?auto=format&fit=crop&q=80&w=800', rating: 4.4 },
    { name: 'Urban Essential Denim Jacket', description: 'Timeless style meets modern comfort. Features distressed details and premium denim fabric.', price: 89.99, category: 'Fashion', stock: 60, image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800', rating: 4.6 },
    { name: 'Merino Wool Winter Sweater', description: 'Ultra-soft, temperature-regulating sweater to keep you warm and stylish during cold seasons.', price: 120, category: 'Fashion', stock: 45, image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800', rating: 4.8 },
    { name: 'Athletic Performance Joggers', description: 'Lightweight, moisture-wicking material ideal for both intense workouts and relaxed weekends.', price: 55, category: 'Fashion', stock: 180, image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&q=80&w=800', rating: 4.5 },
    { name: 'Elegant Silk Blouse', description: 'Luxurious silk with a smooth drape, providing effortless elegance for any formal occasion.', price: 95.5, category: 'Fashion', stock: 75, image_url: 'https://images.unsplash.com/photo-1588117260148-b47818741c74?auto=format&fit=crop&q=80&w=800', rating: 4.7 },
    { name: 'Chronograph Aviator Watch', description: 'Precision quartz movement wrapped in a stainless steel case with genuine leather straps.', price: 150, category: 'Accessories', stock: 90, image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800', rating: 4.5 },
    { name: 'Polarized Retro Sunglasses', description: '100% UV protection with a classic aesthetic. Perfect for sunny escapes and road trips.', price: 35.99, category: 'Accessories', stock: 140, image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800', rating: 4.3 },
    { name: 'Minimalist Leather Wallet', description: 'Slim profile RFID-blocking wallet crafted from full-grain leather for everyday carry.', price: 49.99, category: 'Accessories', stock: 110, image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800', rating: 4.8 },
    { name: 'Canvas Weekender Duffel Bag', description: 'Spacious, durable travel companion featuring water-resistant canvas and brass hardware.', price: 85, category: 'Accessories', stock: 65, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800', rating: 4.6 },
    { name: 'Braided Nylon Charging Cable Set', description: 'Tangle-free, ultra-durable fast charging cables for all your modern devices.', price: 19.99, category: 'Accessories', stock: 200, image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=800', rating: 4.2 },
    { name: 'Artisan Cast Iron Skillet', description: 'Pre-seasoned 12-inch skillet offering unparalleled heat retention for everyday cooking.', price: 45, category: 'Home', stock: 80, image_url: 'https://images.unsplash.com/photo-1585675003310-77a34ea33827?auto=format&fit=crop&q=80&w=800', rating: 4.9 },
    { name: 'Luxe Egyptian Cotton Sheets', description: 'Experience five-star hotel comfort with our 800-thread-count hypoallergenic sheet set.', price: 110, category: 'Home', stock: 50, image_url: 'https://images.unsplash.com/photo-1629853874312-d04ee6e91129?auto=format&fit=crop&q=80&w=800', rating: 4.8 },
    { name: 'Smart Brew Coffee Maker', description: 'Programmable drip coffee machine with precision temperature control and a glass carafe.', price: 79.99, category: 'Home', stock: 70, image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=800', rating: 4.5 },
    { name: 'Botanical Ceramic Vase', description: 'Hand-glazed ceramic vase that acts as a stunning centerpiece for your living space.', price: 34.5, category: 'Home', stock: 100, image_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=800', rating: 4.4 },
    { name: 'Ergonomic Memory Foam Pillow', description: 'Contoured neck support for a restful night’s sleep, accompanied by a cooling bamboo cover.', price: 48, category: 'Home', stock: 130, image_url: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=800', rating: 4.6 },
    { name: 'ProGrip Yoga Mat', description: 'Extra-thick, eco-friendly TPE mat providing excellent cushioning and a non-slip surface.', price: 29.99, category: 'Fitness', stock: 160, image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=800', rating: 4.7 },
    { name: 'Adjustable Dumbbell Set', description: 'Space-saving design replacing 15 sets of weights. Easily dial in your required resistance.', price: 199, category: 'Fitness', stock: 25, image_url: 'https://images.unsplash.com/photo-1586401700818-192eab78eb43?auto=format&fit=crop&q=80&w=800', rating: 4.9 },
    { name: 'Resistance Band System', description: 'Complete full-body workout kit including 5 variable tension bands, handles, and door anchor.', price: 35, category: 'Fitness', stock: 180, image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&q=80&w=800', rating: 4.5 },
    { name: 'HydraFlask Stainless Bottle', description: 'Double-wall vacuum insulation keeps your drinks ice-cold for 24 hours or piping hot for 12.', price: 32.5, category: 'Fitness', stock: 140, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800', rating: 4.8 },
    { name: 'Recovery Massage Gun', description: 'Deep tissue percussion massager with 6 interchangeable heads to relieve muscle stiffness.', price: 115, category: 'Fitness', stock: 55, image_url: 'https://images.unsplash.com/photo-1620054770216-7fb06eaf450a?auto=format&fit=crop&q=80&w=800', rating: 4.6 }
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('--- Production Seed: Products & Inventory ---');
        await client.query('BEGIN');

        for (const p of products) {
            const slug = p.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
            
            // 1. Upsert Product using name as uniqueness arbiter
            const productRes = await client.query(
                `INSERT INTO products (name, slug, description, price, category, image_url, rating) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 ON CONFLICT (name) DO UPDATE SET 
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    image_url = EXCLUDED.image_url,
                    rating = EXCLUDED.rating,
                    updated_at = NOW()
                 RETURNING id`,
                [p.name, slug, p.description, p.price, p.category, p.image_url, p.rating]
            );
            
            const productId = productRes.rows[0].id;

            // 2. Upsert Inventory using composite key (product_id, warehouse)
            await client.query(
                `INSERT INTO inventory (product_id, quantity, warehouse) 
                 VALUES ($1, $2, 'primary') 
                 ON CONFLICT (product_id, warehouse) DO UPDATE SET 
                    quantity = EXCLUDED.quantity,
                    updated_at = NOW()`,
                [productId, p.stock]
            );

            console.log(`Synced: ${p.name} (Stock: ${p.stock})`);
        }

        await client.query('COMMIT');
        console.log('\n--- Seeding completed successfully ---');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n!!! Seeding failed (Transaction Rolled Back) !!!');
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seed();
