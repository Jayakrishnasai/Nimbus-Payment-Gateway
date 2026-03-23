import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export default function TextReveal({ text, className = '' }) {
    const words = text.split(" ");
    
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
        }),
    };
    
    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", damping: 12, stiffness: 100 },
        },
        hidden: { opacity: 0, y: 30, transition: { type: "spring", damping: 12, stiffness: 100 } },
    };

    return (
        <motion.div style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", justifyContent: "center" }} variants={container} initial="hidden" animate="visible" className={className}>
            {words.map((word, index) => (
                <motion.span variants={child} style={{ marginRight: "0.3em" }} key={`${word}-${index}`}>
                    {word === 'NimbusCart' ? <span className="gradient-text drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]">{word}</span> : word}
                </motion.span>
            ))}
        </motion.div>
    );
}

TextReveal.propTypes = {
    text: PropTypes.string.isRequired,
    className: PropTypes.string
};
