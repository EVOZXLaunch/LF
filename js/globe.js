// =====================================================
// LaunchFuture
// Premium Globe Animation
// =====================================================

// =====================================================
// State
// =====================================================

let instance = null;

// =====================================================
// Performance Detection
// =====================================================

function isLowPerformance() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    if (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency < 4) return true;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
    return false;
}

// =====================================================
// Canvas continents texture — draws simplified landmass
// silhouettes in a golden hue on a transparent background.
// =====================================================

function buildContinentsTexture() {
    const w = 1024, h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");

    const patches = [
        // North America
        [[80,50],[120,40],[170,30],[200,35],[210,50],[180,80],[140,95],[100,90],[75,70]],
        // South America
        [[240,230],[280,215],[330,220],[355,250],[340,310],[310,350],[270,370],[245,330],[225,270]],
        // Europe
        [[480,60],[530,50],[560,60],[575,85],[560,110],[530,115],[500,100],[470,80]],
        // Africa
        [[500,140],[545,130],[580,140],[600,180],[590,250],[555,300],[520,320],[490,290],[470,230],[475,170]],
        // Asia
        [[600,50],[670,40],[740,45],[790,60],[810,90],[800,130],[760,150],[720,140],[680,130],[640,120],[610,100],[590,70]],
        // India
        [[730,150],[770,145],[790,170],[775,210],[745,210],[720,175]],
        // Australia
        [[810,340],[860,330],[900,345],[910,380],[880,410],[830,405],[800,370]],
        // Greenland
        [[290,25],[340,15],[380,28],[370,60],[320,65],[280,45]],
        // Antarctica
        [[100,490],[180,480],[300,475],[420,480],[540,478],[660,480],[780,475],[870,480],[920,485],[870,505],[780,510],[660,508],[540,510],[420,508],[300,510],[180,508],[100,505]],
        // UK / Ireland
        [[445,65],[468,60],[480,72],[478,85],[460,88],[440,78]],
        // Japan
        [[830,80],[855,75],[870,88],[865,110],[845,115],[830,98]],
        // Madagascar
        [[625,330],[650,320],[660,345],[648,375],[625,370],[615,345]],
        // Middle East (Arabian peninsula)
        [[630,140],[660,130],[680,145],[670,175],[640,170],[625,155]],
        // Southeast Asia / Indonesia
        [[790,210],[830,205],[860,215],[870,240],[840,255],[800,240],[780,218]],
        // New Zealand
        [[930,410],[950,400],[960,420],[950,445],[935,440],[928,425]],
    ];

    ctx.shadowColor = "rgba(255,216,106,0.35)";
    ctx.shadowBlur = 6;

    for (const patch of patches) {
        ctx.beginPath();
        const s = patch[0];
        ctx.moveTo(s[0], s[1]);
        for (let i = 1; i < patch.length; i++) {
            const cx = (patch[i][0] + patch[i - 1][0]) / 2;
            const cy = (patch[i][1] + patch[i - 1][1]) / 2;
            ctx.quadraticCurveTo(patch[i - 1][0], patch[i - 1][1], cx, cy);
        }
        ctx.closePath();
        const grad = ctx.createRadialGradient(
            s[0] - 20, s[1] - 20, 5,
            s[0], s[1], 120
        );
        grad.addColorStop(0, "rgba(255,216,106,0.55)");
        grad.addColorStop(0.5, "rgba(255,200,80,0.35)");
        grad.addColorStop(1, "rgba(255,180,60,0.08)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,216,106,0.40)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    return new THREE.CanvasTexture(c);
}

// =====================================================
// Starfield background
// =====================================================

function buildStarTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.7, "rgba(0,0,0,0.85)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
}

// =====================================================
// Globe Animation
// =====================================================

class GlobeAnimation {

    constructor(canvas) {
        this.canvas = canvas;
        if (!this.canvas || !window.THREE) return;

        this.lowPower = isLowPerformance();
        this.clock = new THREE.Clock();
        this.dotAngle = 0;
        this.logoAngle = 0;

        this.initRenderer();
        this.initScene();
        this.buildSpaceBackground();
        this.buildGlobe();
        this.buildNetworkLines();
        if (!this.lowPower) {
            this.buildParticles();
            this.buildLogoOrbiter();
        }
        this.buildOrbitRing();
        this.buildGlowRing();
        this.buildAmbientGlow();
        this.setSize();
        this.bindResize();

        this.running = true;
        this.animate();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: !this.lowPower
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lowPower ? 1 : 2));
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        // Separate group for logo so it is never affected by the globe group scale
        this.logoGroup = new THREE.Group();
        this.scene.add(this.logoGroup);
    }

    // Dark space backdrop with subtle glow
    buildSpaceBackground() {
        const starGeo = new THREE.SphereGeometry(12, 32, 32);
        const starMat = new THREE.MeshBasicMaterial({
            map: buildStarTexture(),
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.85
        });
        this.spaceDome = new THREE.Mesh(starGeo, starMat);
        this.scene.add(this.spaceDome);

        // Distant star particles
        if (!this.lowPower) {
            const starCount = 800;
            const positions = new Float32Array(starCount * 3);
            for (let i = 0; i < starCount; i++) {
                const r = 5 + Math.random() * 6;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = r * Math.cos(phi);
                positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({
                color: 0xffd86a,
                transparent: true,
                opacity: 0.15,
                size: 0.04,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            this.stars = new THREE.Points(geo, mat);
            this.scene.add(this.stars);
        }
    }

    buildGlobe() {
        const detail = this.lowPower ? 24 : 48;
        const geo = new THREE.SphereGeometry(1, detail, detail);

        const texture = buildContinentsTexture();
        texture.anisotropy = 4;

        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.70
        });
        this.globe = new THREE.Mesh(geo, mat);
        this.group.add(this.globe);

        // Wireframe overlay for digital look
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xffd86a,
            wireframe: true,
            transparent: true,
            opacity: 0.08
        });
        this.globeWire = new THREE.Mesh(
            new THREE.SphereGeometry(1.002, this.lowPower ? 16 : 28, this.lowPower ? 16 : 28),
            wireMat
        );
        this.group.add(this.globeWire);
    }

    buildNetworkLines() {
        // Latitude rings (horizontal)
        const latCount = this.lowPower ? 6 : 14;
        for (let i = 1; i < latCount; i++) {
            const phi = (i / latCount) * Math.PI;
            const r = Math.sin(phi);
            const y = Math.cos(phi);
            const ringGeo = new THREE.TorusGeometry(r, 0.003, 4, 56);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xffd86a,
                transparent: true,
                opacity: 0.20
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = y;
            ring.rotation.x = Math.PI / 2;
            this.group.add(ring);
        }

        // Longitude rings (vertical)
        const lonCount = this.lowPower ? 4 : 10;
        for (let i = 0; i < lonCount; i++) {
            const theta = (i / lonCount) * Math.PI * 2;
            const ringGeo = new THREE.TorusGeometry(1, 0.003, 4, 56);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xffd86a,
                transparent: true,
                opacity: 0.16
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.y = theta;
            ring.rotation.x = Math.PI / 2;
            this.group.add(ring);
        }
    }

    buildParticles() {
        const count = 500;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const radius = 1.2 + Math.random() * 2.4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            sizes[i] = 0.008 + Math.random() * 0.025;
        }

        const posAttr = new THREE.BufferAttribute(positions, 3);
        const sizeAttr = new THREE.BufferAttribute(sizes, 1);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", posAttr);
        geo.setAttribute("size", sizeAttr);

        const mat = new THREE.PointsMaterial({
            color: 0xffd86a,
            transparent: true,
            opacity: 0.65,
            size: 0.03,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geo, mat);
        this.group.add(this.particles);
    }

    buildLogoOrbiter() {
        const textureLoader = new THREE.TextureLoader();
        const logoTexture = textureLoader.load("./assets/logo.png");

        const spriteMat = new THREE.SpriteMaterial({
            map: logoTexture,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            color: 0xffd86a
        });

        this.logoSprite = new THREE.Sprite(spriteMat);
        this.logoGroup.add(this.logoSprite);

        // Gold glow behind the logo
        const glowMat = new THREE.SpriteMaterial({
            map: (() => {
                const c = document.createElement("canvas");
                c.width = 128;
                c.height = 128;
                const ctx = c.getContext("2d");
                const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
                grad.addColorStop(0, "rgba(255,216,106,1)");
                grad.addColorStop(0.2, "rgba(255,216,106,0.6)");
                grad.addColorStop(0.6, "rgba(255,200,80,0.15)");
                grad.addColorStop(1, "rgba(255,200,80,0)");
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 128, 128);
                return new THREE.CanvasTexture(c);
            })(),
            transparent: true,
            opacity: 0.30,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });
        this.logoGlow = new THREE.Sprite(glowMat);
        this.logoGroup.add(this.logoGlow);
    }

    // Collect all disposable objects for destroy().
    _collectDisposables() {
        const items = [];
        const collect = c => { if (c.geometry || c.material) items.push(c); };
        this.group.traverse(collect);
        this.logoGroup.traverse(collect);
        // Space dome and stars are direct scene children (not in group/logoGroup)
        if (this.spaceDome) items.push(this.spaceDome);
        if (this.stars) items.push(this.stars);
        return items;
    }

    buildOrbitRing() {
        const orbitGeo = new THREE.TorusGeometry(1.38, 0.003, 8, 160);
        const orbitMat = new THREE.MeshBasicMaterial({
            color: 0xffd86a,
            transparent: true,
            opacity: 0.35
        });
        this.orbit = new THREE.Mesh(orbitGeo, orbitMat);
        this.orbit.rotation.x = Math.PI / 6;
        this.group.add(this.orbit);

        // Travelling dot
        const dotGeo = new THREE.SphereGeometry(0.022, 10, 10);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd86a });
        this.dot = new THREE.Mesh(dotGeo, dotMat);
        this.group.add(this.dot);
    }

    buildGlowRing() {
        const ringGeo = new THREE.TorusGeometry(1.10, 0.004, 8, 120);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffd86a,
            transparent: true,
            opacity: 0.55
        });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.ring.rotation.x = Math.PI / 2;
        this.group.add(this.ring);
    }

    buildAmbientGlow() {
        const glowGeo = new THREE.SphereGeometry(1.5, 24, 24);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffd86a,
            transparent: true,
            opacity: 0.045,
            side: THREE.BackSide
        });
        this.ambientGlow = new THREE.Mesh(glowGeo, glowMat);
        this.group.add(this.ambientGlow);
    }

    setSize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const mobile = w < 768;

        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.position.z = mobile ? 3.6 : 2.8;
        this.group.position.set(mobile ? 0 : 0.62, mobile ? 0.55 : 0.18, 0);
        this.group.scale.setScalar(mobile ? 0.85 : 1);
        this.camera.updateProjectionMatrix();

        // Logo stays constant screen size regardless of globe group scale
        const baseLogoScale = 0.32;
        const groupScale = mobile ? 0.85 : 1;
        const compensation = 1 / groupScale;
        if (this.logoSprite) {
            this.logoSprite.scale.setScalar(baseLogoScale * compensation);
        }
        if (this.logoGlow) {
            this.logoGlow.scale.setScalar(baseLogoScale * 2.0 * compensation);
        }
    }

    bindResize() {
        let timer;
        this._resizeHandler = () => {
            clearTimeout(timer);
            timer = setTimeout(() => this.setSize(), 120);
        };
        window.addEventListener("resize", this._resizeHandler);
    }

    animate() {
        if (!this.running) return;
        requestAnimationFrame(() => this.animate());

        const t = this.clock.getElapsedTime();

        // Globe rotation — faster and more visible
        if (this.globe) {
            this.globe.rotation.y = t * 0.18;
            this.globe.rotation.x = Math.sin(t * 0.06) * 0.06;
        }
        if (this.globeWire) {
            this.globeWire.rotation.y = t * 0.18;
            this.globeWire.rotation.x = Math.sin(t * 0.06) * 0.06;
        }

        if (this.orbit) {
            this.orbit.rotation.z = t * 0.08;
        }

        // Orbital ring dot
        if (this.dot) {
            this.dotAngle += 0.012;
            this.dot.position.set(
                Math.cos(this.dotAngle) * 1.38,
                Math.sin(this.dotAngle * 0.5) * 0.3,
                Math.sin(this.dotAngle) * 1.38
            );
        }

        // Particles rotate slowly
        if (this.particles) {
            this.particles.rotation.y = t * 0.025;
            // Subtle pulsing opacity
            this.particles.material.opacity = 0.50 + Math.sin(t * 0.3) * 0.12;
        }

        // Distant stars — very slow drift
        if (this.stars) {
            this.stars.rotation.y = t * 0.003;
            this.stars.rotation.x = Math.sin(t * 0.001) * 0.02;
        }

        // Logo orbit — around the entire scene so it stays visible
        if (this.logoSprite) {
            this.logoAngle += 0.010;
            const orbitRadius = 2.0;
            const x = Math.cos(this.logoAngle) * orbitRadius;
            const y = Math.sin(this.logoAngle * 0.4) * 0.6;
            const z = Math.sin(this.logoAngle) * orbitRadius;

            this.logoGroup.position.set(x, y, z);

            // Pulsing glow
            this.logoSprite.material.opacity = 0.70 + Math.sin(this.logoAngle * 0.6) * 0.15;

            if (this.logoGlow) {
                this.logoGlow.material.opacity = 0.20 + Math.sin(this.logoAngle * 0.6) * 0.10;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.running = false;

        // Dispose every geometry and material to free GPU memory
        for (const item of this._collectDisposables()) {
            if (item.geometry) item.geometry.dispose();
            if (item.material) {
                if (item.material.map) item.material.map.dispose();
                item.material.dispose();
            }
        }

        this.renderer.dispose();

        // Remove resize listener
        if (this._resizeHandler) {
            window.removeEventListener("resize", this._resizeHandler);
            this._resizeHandler = null;
        }

        // Remove page-visibility handler
        if (this._pageHandler) {
            window.removeEventListener("pagehide", this._pageHandler);
            window.removeEventListener("beforeunload", this._pageHandler);
            this._pageHandler = null;
        }

        instance = null;
    }
}

// =====================================================
// Init
// =====================================================

export function initGlobe() {
    if (instance) return instance;
    const canvas = document.getElementById("globeCanvas");
    if (!canvas || !window.THREE) return null;
    instance = new GlobeAnimation(canvas);

    // Auto-cleanup on page leave
    const onPageLeave = () => { if (instance) instance.destroy(); };
    window.addEventListener("pagehide", onPageLeave);
    window.addEventListener("beforeunload", onPageLeave);
    instance._pageHandler = onPageLeave;

    return instance;
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobe);
} else {
    initGlobe();
}

export default GlobeAnimation;
