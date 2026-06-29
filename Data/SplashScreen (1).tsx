import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number; // Depth for 3D perspective
  vx: number;
  vy: number;
  vz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  radius: number;
  opacity: number;
  isAtTarget: boolean;
}

const SplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationPhase, setAnimationPhase] = useState<'particles' | 'text' | 'loading'>('particles');
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef<number>(0);
  const [textReady, setTextReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Initialize particles in 3D space
    const initializeParticles = () => {
      const particles: Particle[] = [];
      const sphereRadiusX = 75;
      const sphereRadiusY = 85;
      const sphereRadiusZ = 70;
      const particleCount = 280;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 - 60;
      const centerZ = 0;

      // Tilt angles for perspective effect (matching logo)
      const tiltX = 0.35; // Slight tilt
      const tiltY = 0.25;

      // Generate particles with proper 3D sphere geometry
      for (let i = 0; i < particleCount; i++) {
        // Fibonacci sphere algorithm with perspective
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;

        // Base sphere position
        let x = sphereRadiusX * Math.sin(phi) * Math.cos(theta);
        let y = sphereRadiusY * Math.sin(phi) * Math.sin(theta);
        let z = sphereRadiusZ * Math.cos(phi);

        // Apply rotation for tilted perspective
        const cosX = Math.cos(tiltX);
        const sinX = Math.sin(tiltX);
        const cosY = Math.cos(tiltY);
        const sinY = Math.sin(tiltY);

        // Rotate around X axis
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;

        // Rotate around Y axis
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;

        // Apply depth perspective (smaller particles fade right)
        const depthFactor = 1 - (x2 + sphereRadiusX) / (2 * sphereRadiusX) * 0.4;

        const targetX = centerX + x2;
        const targetY = centerY + y1;
        const targetZ = z2;

        // Start positions - scattered with perspective
        const startAngle = Math.random() * Math.PI * 2;
        const startDistance = 250 + Math.random() * 350;
        const startX = centerX + Math.cos(startAngle) * startDistance;
        const startY = centerY + Math.sin(startAngle) * startDistance - Math.random() * 100;
        const startZ = (Math.random() - 0.5) * 150;

        particles.push({
          x: startX,
          y: startY,
          z: startZ,
          vx: 0,
          vy: 0,
          vz: 0,
          targetX,
          targetY,
          targetZ,
          radius: (1.2 + Math.random() * 1.1) * depthFactor,
          opacity: 0,
          isAtTarget: false,
        });
      }

      // Sort by Z depth for proper rendering order
      particles.sort((a, b) => a.targetZ - b.targetZ);
      particlesRef.current = particles;
    };

    initializeParticles();

    // Animation loop with 60fps
    let lastTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016);
      lastTime = currentTime;

      timeRef.current += 16;
      const totalAnimationTime = 2800; // Faster convergence

      // Clear canvas with background
      ctx.fillStyle = '#F5F1ED';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      let allAtTarget = true;

      // Render particles
      particles.forEach((particle, index) => {
        // Staggered start with easing
        const staggerDelay = (index / particles.length) * 300;
        const particleTime = Math.max(0, timeRef.current - staggerDelay);
        const progress = Math.min(1, particleTime / totalAnimationTime);

        // Smooth easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        // Smooth interpolation to target
        particle.x += (particle.targetX - particle.x) * eased * 0.18;
        particle.y += (particle.targetY - particle.y) * eased * 0.18;
        particle.z += (particle.targetZ - particle.z) * eased * 0.18;

        // Check convergence
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const dz = particle.targetZ - particle.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        particle.isAtTarget = distance < 0.8;

        if (!particle.isAtTarget) {
          allAtTarget = false;
        }

        // Smooth fade in
        particle.opacity = Math.min(1, particleTime / 500);

        // Depth-based opacity (fade right)
        const depthOpacity = 0.7 + particle.z / 150 * 0.3;

        // Draw particle
        ctx.fillStyle = `rgba(74, 62, 53, ${particle.opacity * depthOpacity * 0.9})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, Math.max(0.5, particle.radius), 0, Math.PI * 2);
        ctx.fill();
      });

      // Transition to text phase
      if (allAtTarget && timeRef.current > totalAnimationTime + 400) {
        if (animationPhase === 'particles') {
          setTextReady(true);
          setAnimationPhase('text');
          timeRef.current = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [animationPhase]);

  // Text phase timing
  useEffect(() => {
    if (animationPhase === 'text') {
      const timer = setTimeout(() => {
        setAnimationPhase('loading');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [animationPhase]);

  return (
    <div className="splash-screen">
      <canvas ref={canvasRef} className="splash-canvas" />

      {/* Text content below logo */}
      <div className={`splash-content ${animationPhase}`}>
        <div className={`splash-text-container ${animationPhase}`}>
          <h1 className="splash-title">TECHSPHERE</h1>
          <p className="splash-tagline">YOUR PERFECT DIGITAL SOLUTIONS</p>
        </div>

        {/* Premium minimal loader */}
        {animationPhase === 'loading' && (
          <div className="splash-loader">
            <div className="loader-bar" />
          </div>
        )}
      </div>

      <style jsx>{`
        .splash-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #F5F1ED;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        }

        .splash-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .splash-content {
          position: relative;
          z-index: 10;
          text-align: center;
          margin-top: 140px;
          opacity: 0;
        }

        .splash-content.text {
          animation: contentFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }

        .splash-content.loading {
          animation: contentFadeIn 0.5s ease-out forwards;
        }

        .splash-text-container {
          opacity: 0;
          transform: translateY(15px);
        }

        .splash-text-container.text {
          animation: titleSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }

        .splash-title {
          font-size: clamp(2.8rem, 8vw, 3.5rem);
          font-weight: 600;
          letter-spacing: -0.015em;
          color: #4A3E35;
          margin: 0;
          margin-bottom: 10px;
          line-height: 1.15;
          font-variant-numeric: lining-nums;
        }

        .splash-tagline {
          font-size: clamp(0.75rem, 2vw, 0.9rem);
          font-weight: 400;
          letter-spacing: 0.12em;
          color: #8B7B6F;
          margin: 0;
          text-transform: uppercase;
          opacity: 0.9;
          word-spacing: 0.05em;
        }

        .splash-loader {
          margin-top: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: loaderFadeIn 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }

        .loader-bar {
          width: 160px;
          height: 1.5px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #A89A8F 15%,
            #4A3E35 50%,
            #A89A8F 85%,
            transparent 100%
          );
          position: relative;
          overflow: hidden;
          border-radius: 1px;
          box-shadow: 0 0 0 1px rgba(74, 62, 53, 0.08);
        }

        .loader-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(74, 62, 53, 0.5) 50%,
            transparent 100%
          );
          animation: shimmerFlow 2.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        @keyframes shimmerFlow {
          0% {
            transform: translateX(-150%);
          }
          100% {
            transform: translateX(150%);
          }
        }

        @keyframes contentFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes titleSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loaderFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .splash-content {
            margin-top: 120px;
          }

          .splash-title {
            margin-bottom: 8px;
          }

          .splash-loader {
            margin-top: 40px;
          }

          .loader-bar {
            width: 120px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
