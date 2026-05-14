import { motion } from 'motion/react';

export function SystemDiagrams({ name }: { name: string }) {
    const getDiagram = () => {
        switch (name) {
            case 'AADS':
                return (
                    <svg viewBox="0 0 400 240" className="w-full h-full opacity-70">
                        {/* Protected Infrastructure */}
                        <rect x="140" y="80" width="120" height="80" rx="4" fill="none" stroke="var(--text-muted)" strokeWidth="0.5" strokeDasharray="2 2" />
                        <text x="200" y="125" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">INFRASTRUCTURE</text>

                        {/* Governance Layers */}
                        <motion.circle
                            animate={{ r: [60, 65, 60] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            cx="200" cy="120" r="60" fill="none" stroke="var(--accent-color)" strokeWidth="0.2" opacity="0.3"
                        />

                        {/* Swarm Agents - Positioning for defense */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 0.9,
                                    x: 200 + Math.cos(i * (Math.PI * 2) / 6) * 90,
                                    y: 120 + Math.sin(i * (Math.PI * 2) / 6) * 70
                                }}
                                transition={{ duration: 1 }}
                            >
                                {/* Agent Hub */}
                                <circle cx="0" cy="0" r="10" fill="var(--bg-surface)" stroke="var(--text-secondary)" strokeWidth="0.5" />
                                <motion.circle
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                    cx="0" cy="0" r="3" fill="var(--accent-color)"
                                />
                                <text x="0" y="2" textAnchor="middle" fill="var(--text-muted)" fontSize="4" fontFamily="var(--font-mono)">S-AGENT</text>

                                {/* Role Switching pulses */}
                                <motion.circle
                                    animate={{ r: [10, 20], opacity: [1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.7 }}
                                    cx="0" cy="0" fill="none" stroke="var(--accent-color)" strokeWidth="0.2"
                                />
                            </motion.g>
                        ))}

                        {/* Threat Mitigation Visualization */}
                        {[0, 1, 2].map((i) => (
                            <motion.g key={i}>
                                {/* Incoming Threat */}
                                <motion.line
                                    initial={{ x1: 0, y1: 40 + i * 80, x2: 40, y2: 40 + i * 80, opacity: 0 }}
                                    animate={{ x1: 80, x2: 120, opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 1.2 }}
                                    stroke="#D4183D" strokeWidth="1"
                                />
                                {/* Agent Interception */}
                                <motion.path
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 1.2 + 0.5 }}
                                    d={`M110,${45 + i * 80} L140,${120}`}
                                    stroke="var(--accent-color)" strokeWidth="0.5" strokeDasharray="2 2"
                                />
                            </motion.g>
                        ))}

                        <text x="200" y="220" textAnchor="middle" fill="var(--accent-color)" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.2em">SWARM DEFENSE ACTIVE</text>
                    </svg>
                );
            case 'REVA4 Runtime':
            case 'RLAE (REVA4)':
                return (
                    <svg viewBox="0 0 400 240" className="w-full h-full opacity-60">
                        {/* Stacked Model Architecture */}
                        <rect x="140" y="60" width="120" height="120" rx="4" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4" />
                        <text x="200" y="125" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">BASE MODEL</text>

                        {/* Reversible LoRA Layers */}
                        {[0, 1, 3].map((i) => (
                            <motion.g
                                key={i}
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: i * 0.5, duration: 0.8 }}
                            >
                                <rect x="150" y={70 + i * 25} width="100" height="20" rx="1" fill="rgba(45, 91, 255, 0.1)" stroke="var(--accent-color)" strokeWidth="0.5" />
                                <text x="200" y={83 + i * 25} textAnchor="middle" fill="var(--accent-color)" fontSize="6" fontFamily="var(--font-mono)">ADAPTATION LAYER {i + 1}</text>
                            </motion.g>
                        ))}

                        {/* Rollback Action */}
                        <motion.path
                            animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, times: [0, 0.8, 1] }}
                            d="M270,160 Q300,160 300,120 Q300,80 270,80"
                            fill="none"
                            stroke="#D4183D"
                            strokeWidth="1"
                        />
                        <text x="310" y="123" fill="#D4183D" fontSize="6" fontFamily="var(--font-mono)">ROLLBACK</text>
                    </svg>
                );
            case 'LBSM':
                return (
                    <svg viewBox="0 0 400 240" className="w-full h-full opacity-60">
                        {/* Statistical manifold grid */}
                        <defs>
                            <pattern id="lbsm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" strokeWidth="0.2" />
                            </pattern>
                        </defs>
                        <rect width="400" height="240" fill="url(#lbsm-grid)" />

                        {/* Behavioral attractor basins */}
                        {[
                            { cx: 110, cy: 145, rx: 55, ry: 35, label: 'STABLE', delay: 0 },
                            { cx: 200, cy: 92, rx: 52, ry: 30, label: 'ADAPTIVE', delay: 0.5 },
                            { cx: 292, cy: 145, rx: 60, ry: 36, label: 'EXPLORATORY', delay: 1 }
                        ].map((basin) => (
                            <motion.g key={basin.label}>
                                <motion.ellipse
                                    animate={{ scale: [1, 1.04, 1], opacity: [0.2, 0.35, 0.2] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: basin.delay }}
                                    cx={basin.cx}
                                    cy={basin.cy}
                                    rx={basin.rx}
                                    ry={basin.ry}
                                    fill="rgba(45, 91, 255, 0.08)"
                                    stroke="var(--accent-color)"
                                    strokeWidth="0.4"
                                />
                                <text
                                    x={basin.cx}
                                    y={basin.cy}
                                    textAnchor="middle"
                                    fill="var(--text-muted)"
                                    fontSize="6"
                                    fontFamily="var(--font-mono)"
                                >
                                    {basin.label}
                                </text>
                            </motion.g>
                        ))}

                        {/* Transitional manifold bridge */}
                        <motion.path
                            animate={{
                                d: [
                                    'M105,145 C145,95 175,75 205,94 C235,115 255,135 295,145',
                                    'M105,145 C148,105 178,70 205,94 C232,118 258,128 295,145'
                                ]
                            }}
                            transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
                            d="M105,145 C145,95 175,75 205,94 C235,115 255,135 295,145"
                            fill="none"
                            stroke="var(--accent-color)"
                            strokeWidth="0.8"
                            strokeDasharray="3 3"
                        />

                        {/* Latent telemetry nodes */}
                        {[
                            { x: 90, y: 140 },
                            { x: 145, y: 112 },
                            { x: 205, y: 94 },
                            { x: 250, y: 120 },
                            { x: 310, y: 148 }
                        ].map((node, i) => (
                            <g key={i}>
                                <circle cx={node.x} cy={node.y} r="2.5" fill="var(--accent-color)" />
                                <motion.circle
                                    animate={{ r: [2.5, 10], opacity: [0.5, 0] }}
                                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.25 }}
                                    cx={node.x}
                                    cy={node.y}
                                    fill="var(--accent-color)"
                                />
                            </g>
                        ))}

                        {/* Temporal trajectory */}
                        <motion.path
                            animate={{ strokeDashoffset: [0, -180] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                            d="M75,160 C110,120 150,115 178,102 S240,88 285,120 S325,160 340,128"
                            fill="none"
                            stroke="var(--text-secondary)"
                            strokeWidth="0.7"
                            strokeDasharray="5 7"
                        />
                        <motion.circle
                            animate={{
                                cx: [75, 110, 150, 178, 225, 285, 340],
                                cy: [160, 120, 115, 102, 92, 120, 128],
                                opacity: [0.4, 1, 1, 1, 1, 1, 0.4]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            r="4"
                            fill="#D4183D"
                        />

                        {/* Unstable drift zone */}
                        <motion.circle
                            animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.22, 0.08] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            cx="324" cy="74" r="26" fill="#D4183D"
                        />
                        <text x="324" y="77" textAnchor="middle" fill="#D4183D" fontSize="5" fontFamily="var(--font-mono)">DRIFT</text>
                        <text x="200" y="220" textAnchor="middle" fill="var(--accent-color)" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.18em">LATENT BEHAVIORAL MANIFOLDS</text>
                    </svg>
                );
            case 'OpenLoRA':
                return (
                    <svg viewBox="0 0 400 240" className="w-full h-full opacity-60">
                        {/* Training Infrastructure */}
                        <rect x="80" y="40" width="240" height="160" rx="2" fill="none" stroke="var(--text-muted)" strokeWidth="1" />
                        <text x="200" y="55" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">LOCAL LLM ENGINE</text>

                        {/* Dataset Synthesizer */}
                        <rect x="100" y="80" width="60" height="30" rx="1" fill="none" stroke="var(--text-secondary)" strokeWidth="0.5" />
                        <text x="130" y="98" textAnchor="middle" fill="var(--text-secondary)" fontSize="5" fontFamily="var(--font-mono)">SYNTHESIZER</text>

                        {/* Training Pipeline */}
                        <motion.line
                            animate={{ x2: [160, 240], opacity: [1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            x1="160" y1="95" x2="240" y2="95" stroke="var(--accent-color)" strokeWidth="0.5"
                        />

                        {/* LoRA Engine */}
                        <rect x="240" y="80" width="60" height="30" rx="1" fill="none" stroke="var(--accent-color)" strokeWidth="1" />
                        <text x="270" y="98" textAnchor="middle" fill="var(--accent-color)" fontSize="5" fontFamily="var(--font-mono)">LORA ENGINE</text>

                        {/* Observability */}
                        <g transform="translate(100, 140)">
                            <rect width="200" height="40" rx="1" fill="none" stroke="var(--border-color)" strokeWidth="0.5" />
                            <motion.path
                                animate={{
                                    d: [
                                        "M10,30 Q30,10 50,30 T90,30 T130,30 T170,30 T190,30",
                                        "M10,25 Q30,35 50,20 T90,30 T130,25 T170,35 T190,20"
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                d="M10,30 Q30,10 50,30 T90,30 T130,30 T170,30 T190,30"
                                fill="none" stroke="var(--accent-color)" strokeWidth="0.5"
                            />
                            <text x="100" y="10" textAnchor="middle" fill="var(--text-muted)" fontSize="6" fontFamily="var(--font-mono)">OBSERVABILITY (PROMETHEUS)</text>
                        </g>
                    </svg>
                );
            case 'Project Ouroboros':
                return (
                    <svg viewBox="0 0 400 240" className="w-full h-full opacity-60">
                        {/* ESP32 Module */}
                        <rect x="160" y="80" width="80" height="80" rx="2" fill="#1A1A1A" stroke="var(--text-muted)" strokeWidth="1" />
                        <rect x="175" y="95" width="50" height="50" rx="1" fill="none" stroke="var(--accent-color)" strokeWidth="0.5" />
                        <text x="200" y="125" textAnchor="middle" fill="var(--accent-color)" fontSize="10" fontFamily="var(--font-mono)">ESP32</text>

                        {/* Pins */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <rect key={i} x="155" y={85 + i * 12} width="5" height="4" fill="var(--text-muted)" />
                        ))}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <rect key={i} x="240" y={85 + i * 12} width="5" height="4" fill="var(--text-muted)" />
                        ))}

                        {/* Wireless Defense Waves */}
                        {[1, 2, 3].map((i) => (
                            <motion.path
                                key={i}
                                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                d={`M240,120 Q280,${120 - i * 20} 320,120 Q280,${120 + i * 20} 240,120`}
                                fill="none"
                                stroke="var(--accent-color)"
                                strokeWidth="0.5"
                            />
                        ))}

                        {/* Monitoring visualization */}
                        <motion.path
                            animate={{ strokeDashoffset: [100, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            d="M80,80 L160,120 M80,160 L160,120"
                            stroke="var(--text-secondary)"
                            strokeWidth="0.5"
                            strokeDasharray="4 4"
                        />
                        <text x="100" y="100" fill="var(--text-secondary)" fontSize="6" fontFamily="var(--font-mono)">RF SCAN</text>
                    </svg>
                );
            default:
                return (
                    <svg viewBox="0 0 400 240" className="w-full h-full opacity-40">
                        <path d="M50,120 Q200,20 350,120 T50,120" fill="none" stroke="var(--accent-color)" strokeWidth="0.5" />
                        <circle cx="200" cy="120" r="40" fill="none" stroke="var(--text-muted)" strokeWidth="0.5" strokeDasharray="2 2" />
                        <text x="200" y="125" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">{name} ARCHITECTURE</text>
                    </svg>
                );
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            {getDiagram()}
        </div>
    );
}
