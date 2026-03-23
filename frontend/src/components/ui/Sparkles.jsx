import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export default function Sparkles({ minSize = 1, maxSize = 3, particleDensity = 50, className = '', particleColor = '#14b8a6' }) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const generateParticles = () => {
            const count = particleDensity;
            const newParticles = Array.from({ length: count }).map((_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * (maxSize - minSize) + minSize,
                opacity: Math.random() * 0.5 + 0.3,
                duration: Math.random() * 2 + 2,
                delay: Math.random() * 2
            }));
            setParticles(newParticles);
        };
        generateParticles();
    }, [maxSize, minSize, particleDensity]);

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: particleColor,
                    }}
                    animate={{
                        opacity: [p.opacity, p.opacity * 2.5, p.opacity],
                        scale: [1, 1.5, 1],
                        y: [0, -15, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}

Sparkles.propTypes = {
    minSize: PropTypes.number,
    maxSize: PropTypes.number,
    particleDensity: PropTypes.number,
    className: PropTypes.string,
    particleColor: PropTypes.string
};
