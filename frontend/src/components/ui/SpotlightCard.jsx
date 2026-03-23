import { useRef, useState } from 'react';
import PropTypes from 'prop-types';

export default function SpotlightCard({ children, className = '' }) {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;
        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            role="presentation"
            className={`relative overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px transition duration-300 rounded-2xl"
                style={{
                    opacity,
                    background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(20, 184, 166, 0.15), transparent 40%)`
                }}
            />
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}

SpotlightCard.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};
