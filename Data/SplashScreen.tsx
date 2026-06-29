"use client";

import { useEffect, useRef, useState, useCallback, Fragment } from "react";

// ─── Design Tokens (extracted from TechSphere logo + Design Academy reference) ──
const C = {
  bg:    "#FAEEE4",
  dot:   "#5B3A22",
  mid:   "#7B5B3A",
  light: "#C4A882",
  pale:  "#EDD9C8",
  dark:  "#3D2314",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobeDot {
  px: number; py: number;
  dotR: number; delay: number;
  alpha: number; scale: number;
}
interface Floater {
  x: number; y: number; r: number;
  vx: number; vy: number; alpha: number;
  col: string;
}
interface Ring {
  r: number; maxR: number; alpha: number; born: number;
}
interface BgShape {
  x: number; y: number;
  w?: number; h?: number; rx?: number;
  r?: number; tri?: boolean; size?: number;
  col: string; alpha: number; rot: number; rotV: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildGlobeDots(cx: number, cy: number, R: number): GlobeDot[] {
  const ROWS = 20;
  const dots: GlobeDot[] = [];
  for (let row = 0; row < ROWS; row++) {
    const phi   = Math.PI * (row + 0.5) / ROWS;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const cols  = Math.max(1, Math.round(ROWS * sinPhi * 1.1));
    for (let col = 0; col < cols; col++) {
      const theta = 2 * Math.PI * col / cols;
      const x3 = sinPhi * Math.cos(theta);
      const y3 = -cosPhi;
      const z3 = sinPhi * Math.sin(theta);
      if (z3 > -0.5) {
        const depth = (z3 + 1) / 2;
        const dotR  = Math.max(1, R * 0.032 * depth * sinPhi * 2.2);
        const px = cx + x3 * R;
        const py = cy + (y3 * 0.88 - z3 * 0.18) * R;
        const delay =
          ((px - (cx - R)) / (R * 2)) * 0.55 +
          ((py - (cy - R)) / (R * 2)) * 0.35;
        dots.push({ px, py, dotR, delay, alpha: 0, scale: 0 });
      }
    }
  }
  dots.sort((a, b) => a.delay - b.delay);
  return dots;
}

function animCount(
  setter: (v: string) => void,
  to: number, suffix: string, duration: number
) {
  const start = performance.now();
  function step(now: number) {
    const p = Math.min((now - start) / duration, 1);
    const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    setter(Math.round(to * e) + suffix);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const bgRef   = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef<number>(0);
  const stateRef = useRef({
    t: 0, startTime: 0,
    uiTriggered: false, ringSpawned: false,
    rings: [] as Ring[],
    floaters: [] as Floater[],
    bgShapes: [] as BgShape[],
    globeDots: [] as GlobeDot[],
    maxDelay: 1,
    globeCX: 0, globeCY: 0, globeR: 0,
    W: 0, H: 0,
  });

  // UI state
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [shimmer, setShimmer]                 = useState(false);
  const [dividerVisible, setDividerVisible]   = useState(false);
  const [taglineVisible, setTaglineVisible]   = useState(false);
  const [statsVisible, setStatsVisible]       = useState(false);
  const [btnVisible, setBtnVisible]           = useState(false);
  const [progressGo, setProgressGo]           = useState(false);
  const [s1, setS1] = useState("0");
  const [s2, setS2] = useState("0");
  const [s3, setS3] = useState("0");

  const triggerUI = useCallback(() => {
    setTimeout(() => { setWordmarkVisible(true); setShimmer(true); },   80);
    setTimeout(() => setDividerVisible(true),  300);
    setTimeout(() => setTaglineVisible(true),  520);
    setTimeout(() => {
      setStatsVisible(true);
      animCount(setS1, 300, "+", 900);
      animCount(setS2,  50, "+", 900);
      animCount(setS3, 1000, "+", 900);
    }, 780);
    setTimeout(() => setBtnVisible(true),     1100);
    setProgressGo(true);
    setTimeout(() => onFinish?.(), 2500);
  }, [onFinish]);

  useEffect(() => {
    const root = rootRef.current;
    const bgC  = bgRef.current;
    const mc   = mainRef.current;
    if (!root || !bgC || !mc) return;

    const W = root.offsetWidth  || 680;
    const H = root.offsetHeight || 580;
    bgC.width = mc.width  = W;
    bgC.height = mc.height = H;

    const bgX = bgC.getContext("2d")!;
    const ctx = mc.getContext("2d")!;
    const s = stateRef.current;

    s.W = W; s.H = H;
    const isMobile = W < 480;
    s.globeR  = isMobile ? W * 0.28 : Math.min(H * 0.38, W * 0.22);
    s.globeCX = isMobile ? W * 0.5  : W * 0.26;
    s.globeCY = H * 0.46;

    // Build globe dots
    s.globeDots = buildGlobeDots(s.globeCX, s.globeCY, s.globeR);
    s.maxDelay  = s.globeDots.reduce((m, d) => Math.max(m, d.delay), 0);

    // Floaters
    s.floaters = Array.from({ length: 22 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 3 + Math.random() * 18,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.12,
      alpha: 0.06 + Math.random() * 0.12,
      col: [C.light, C.pale, C.mid][i % 3],
    }));

    // Bg shapes
    s.bgShapes = [
      { x: W*0.82, y: -0.04*H, w: W*0.14, h: W*0.14, rx: 6,       col: C.mid,   alpha: 0.15, rot: 0, rotV:  0.002 },
      { x: W*0.89, y: H*0.13,  r: W*0.09,              col: C.light, alpha: 0.20, rot: 0, rotV:  0 },
      { x: W*0.9,  y: H*0.30,  w: W*0.1, h: W*0.1, rx: W*0.05,    col: C.pale,  alpha: 0.50, rot: 0, rotV:  0.001 },
      { x: 0,      y: H*0.85,  r: W*0.11,              col: C.light, alpha: 0.18, rot: 0, rotV:  0 },
      { x: W*0.10, y: H*0.78,  w: W*0.09, h: W*0.09, rx: W*0.045, col: C.pale,  alpha: 0.45, rot: 0, rotV: -0.001 },
      { x: W*0.07, y: H*0.07,  r: W*0.04,              col: C.pale,  alpha: 0.40, rot: 0, rotV:  0 },
      { x: W*0.78, y: H*0.70,  tri: true, size: W*0.05, col: C.mid,  alpha: 0.10, rot: 0, rotV:  0.003 },
    ];

    function drawBgShape(sh: BgShape, progress: number) {
      bgX.save();
      bgX.globalAlpha = sh.alpha * Math.min(progress * 2, 1);
      if (sh.tri && sh.size) {
        bgX.translate(sh.x, sh.y);
        bgX.rotate(sh.rot);
        bgX.beginPath();
        bgX.moveTo(0, -sh.size);
        bgX.lineTo(sh.size, sh.size);
        bgX.lineTo(-sh.size, sh.size);
        bgX.closePath();
        bgX.fillStyle = sh.col;
        bgX.fill();
      } else if (sh.r) {
        bgX.beginPath();
        bgX.arc(sh.x, sh.y, sh.r * (0.8 + Math.sin(s.t * 0.5 + sh.x) * 0.05), 0, Math.PI * 2);
        bgX.fillStyle = sh.col;
        bgX.fill();
      } else if (sh.w && sh.h && sh.rx !== undefined) {
        bgX.translate(sh.x + sh.w / 2, sh.y + sh.h / 2);
        bgX.rotate(sh.rot);
        roundRect(bgX, -sh.w / 2, -sh.h / 2, sh.w, sh.h, sh.rx);
        bgX.fillStyle = sh.col;
        bgX.fill();
      }
      bgX.restore();
      sh.rot += sh.rotV;
    }

    let uiDone = false;

    function loop(now: number) {
      if (!s.startTime) s.startTime = now;
      const elapsed = (now - s.startTime) / 1000;
      s.t = elapsed;

      const DOT_DUR = 1.3;
      const dotProgress = Math.min(elapsed / DOT_DUR, 1);
      const eased = dotProgress < 0.5
        ? 2 * dotProgress * dotProgress
        : -1 + (4 - 2 * dotProgress) * dotProgress;

      // BG canvas
      bgX.clearRect(0, 0, W, H);
      bgX.fillStyle = C.bg;
      bgX.fillRect(0, 0, W, H);

      // Floaters
      s.floaters.forEach(f => {
        f.x += f.vx; f.y += f.vy;
        if (f.x < -30) f.x = W + 30;
        if (f.x > W + 30) f.x = -30;
        if (f.y < -30) f.y = H + 30;
        if (f.y > H + 30) f.y = -30;
        bgX.save();
        bgX.globalAlpha = f.alpha;
        bgX.fillStyle = f.col;
        bgX.beginPath();
        bgX.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        bgX.fill();
        bgX.restore();
      });

      s.bgShapes.forEach(sh => drawBgShape(sh, eased));

      // Main canvas
      ctx.clearRect(0, 0, W, H);

      // Ripple rings
      for (let i = s.rings.length - 1; i >= 0; i--) {
        const rg = s.rings[i];
        const age = s.t - rg.born;
        const rp  = Math.min(age / 1.8, 1);
        rg.r = s.globeR * 0.3 + rp * (rg.maxR - s.globeR * 0.3);
        const ea = 1 - rp;
        ctx.save();
        ctx.strokeStyle = C.light;
        ctx.globalAlpha = rg.alpha * ea * ea;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.globeCX, s.globeCY, rg.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (rp >= 1) s.rings.splice(i, 1);
      }

      // Spawn first ring when globe ~80% formed
      if (dotProgress > 0.8 && !s.ringSpawned) {
        s.rings.push({ r: s.globeR * 0.3, maxR: s.globeR * 1.05, alpha: 0.35, born: s.t });
        s.ringSpawned = true;
      }
      // Periodic rings thereafter
      if (dotProgress >= 1 && Math.floor(s.t * 0.6) > Math.floor((s.t - 1 / 60) * 0.6)) {
        s.rings.push({ r: s.globeR * 0.3, maxR: s.globeR * 1.08, alpha: 0.28, born: s.t });
      }

      // Globe pulse
      const pulse = 1 + Math.sin(s.t * 2.1) * 0.008;
      ctx.save();
      ctx.translate(s.globeCX, s.globeCY);
      ctx.scale(pulse, pulse);
      ctx.translate(-s.globeCX, -s.globeCY);

      // Globe dots — spring physics
      s.globeDots.forEach(d => {
        const target = d.delay / s.maxDelay <= eased ? 1 : 0;
        d.scale += (target - d.scale) * 0.18;
        d.alpha += (target - d.alpha) * 0.15;
        if (d.alpha < 0.01) return;
        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = C.dot;
        ctx.translate(d.px, d.py);
        ctx.scale(d.scale, d.scale);
        ctx.translate(-d.px, -d.py);
        ctx.beginPath();
        ctx.arc(d.px, d.py, d.dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      // Trigger UI once
      if (dotProgress > 0.85 && !uiDone) {
        uiDone = true;
        triggerUI();
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    const t0 = setTimeout(() => {
      rafRef.current = requestAnimationFrame(loop);
    }, 80);

    return () => {
      clearTimeout(t0);
      cancelAnimationFrame(rafRef.current);
    };
  }, [triggerUI]);

  return (
    <div
      ref={rootRef}
      style={{
        minHeight: "100svh", width: "100%",
        background: C.bg, position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Canvas layers */}
      <canvas ref={bgRef}   style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <canvas ref={mainRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* UI overlay */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 5%",
        flexWrap: "wrap", gap: "clamp(1rem,4vw,3rem)",
      }}>
        {/* Globe placeholder — actual globe is on canvas */}
        <div style={{ flex: "0 0 auto", width: "clamp(180px,38%,340px)", aspectRatio: "1" }} />

        {/* Text block */}
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column" }}>

          {/* Wordmark */}
          <div style={{ overflow: "hidden", position: "relative", marginBottom: "0.5rem" }}>
            <span style={{
              display: "block",
              fontSize: "clamp(1.8rem,4.5vw,3.4rem)",
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: C.dark,
              lineHeight: 1,
              transform: wordmarkVisible ? "translateY(0)" : "translateY(110%)",
              opacity: wordmarkVisible ? 1 : 0,
              transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease",
            }}>
              TECHSPHERE
            </span>
            {/* Shimmer sweep */}
            <div style={{
              position: "absolute", top: 0, left: shimmer ? "160%" : "-60%",
              width: "60%", height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,220,180,0.45), transparent)",
              transition: shimmer ? "left 0.8s ease 0.2s" : "none",
              pointerEvents: "none",
            }} />
          </div>

          {/* Divider */}
          <div style={{
            height: "2.5px", background: C.mid, borderRadius: "2px",
            width: dividerVisible ? "80px" : "0",
            margin: "1rem 0",
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s",
          }} />

          {/* Tagline */}
          <p style={{
            fontSize: "clamp(0.55rem,1.1vw,0.72rem)",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: C.mid,
            fontWeight: 500,
            marginBottom: "1.8rem",
            opacity: taglineVisible ? 1 : 0,
            transform: taglineVisible ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
          }}>
            Your Perfect Digital Solutions
          </p>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: "clamp(1rem,2.5vw,2rem)",
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
            {[
              { val: s1, label: "Projects" },
              { val: s2, label: "Expert Team" },
              { val: s3, label: "Happy Clients" },
            ].map((item, i) => (
              <Fragment key={item.label}>
                {i > 0 && (
                  <div style={{
                    width: "1px", background: C.light,
                    margin: "0.1rem 0", alignSelf: "stretch",
                  }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{
                    fontSize: "clamp(1.3rem,2.5vw,2rem)",
                    fontWeight: 800, color: C.dark, lineHeight: 1,
                  }}>
                    {item.val}
                  </span>
                  <span style={{
                    fontSize: "clamp(0.55rem,0.9vw,0.68rem)",
                    color: C.mid, letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}>
                    {item.label}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>

          {/* CTA button */}
          <button
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              marginTop: "1.5rem",
              padding: "0.6rem 1.4rem",
              border: `1.5px solid ${C.mid}`,
              borderRadius: "100px",
              color: C.dark,
              fontSize: "clamp(0.6rem,1vw,0.72rem)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              opacity: btnVisible ? 1 : 0,
              transform: btnVisible ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.5s ease, transform 0.5s ease, background 0.2s, color 0.2s",
              alignSelf: "flex-start",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = C.dark;
              (e.currentTarget as HTMLButtonElement).style.color = C.bg;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = C.dark;
            }}
          >
            Explore &rarr;
          </button>
        </div>
      </div>

      {/* Bottom progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "3px", background: C.pale, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", background: C.dot,
          borderRadius: "0 2px 2px 0",
          width: progressGo ? "100%" : "0%",
          transition: "width 2.2s cubic-bezier(0.4,0,0.2,1) 0.1s",
        }} />
      </div>
    </div>
  );
}
