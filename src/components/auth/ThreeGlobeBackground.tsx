import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeGlobeBackgroundProps {
  theme?: 'dark' | 'light';
}

export const ThreeGlobeBackground: React.FC<ThreeGlobeBackgroundProps> = ({ theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    const updateCameraPosition = () => {
      const aspect = window.innerWidth / window.innerHeight;
      camera.aspect = aspect;
      if (aspect < 0.7) {
        camera.position.z = 62;
      } else if (aspect < 1.0) {
        camera.position.z = 70;
      } else {
        camera.position.z = 82;
      }
      camera.updateProjectionMatrix();
    };
    updateCameraPosition();

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 3. Glow Point Texture
    const createGlowPointTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(165, 180, 252, 0.9)');
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    const pointTexture = createGlowPointTexture();
    const galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    // 4. Particle Globe
    const globeRadius = 25;
    const globePointsCount = 2800;
    const globePositions = new Float32Array(globePointsCount * 3);
    const globeColors = new Float32Array(globePointsCount * 3);

    const colorElectricCyan = new THREE.Color(0x22d3ee);
    const colorNeonIndigo = new THREE.Color(0x6366f1);
    const colorElectricViolet = new THREE.Color(0x818cf8);
    const colorDeepPurple = new THREE.Color(0xa855f7);

    for (let i = 0; i < globePointsCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / globePointsCount);
      const theta = Math.sqrt(globePointsCount * Math.PI) * phi;

      const x = globeRadius * Math.cos(theta) * Math.sin(phi);
      const y = globeRadius * Math.sin(theta) * Math.sin(phi);
      const z = globeRadius * Math.cos(phi);

      globePositions[i * 3] = x;
      globePositions[i * 3 + 1] = y;
      globePositions[i * 3 + 2] = z;

      const mixedColor = new THREE.Color();
      const ratio = (y + globeRadius) / (globeRadius * 2);
      if (ratio < 0.4) {
        mixedColor.lerpColors(colorElectricCyan, colorNeonIndigo, ratio / 0.4);
      } else if (ratio < 0.75) {
        mixedColor.lerpColors(colorNeonIndigo, colorElectricViolet, (ratio - 0.4) / 0.35);
      } else {
        mixedColor.lerpColors(colorElectricViolet, colorDeepPurple, (ratio - 0.75) / 0.25);
      }

      globeColors[i * 3] = mixedColor.r;
      globeColors[i * 3 + 1] = mixedColor.g;
      globeColors[i * 3 + 2] = mixedColor.b;
    }

    const globeGeometry = new THREE.BufferGeometry();
    globeGeometry.setAttribute('position', new THREE.BufferAttribute(globePositions, 3));
    globeGeometry.setAttribute('color', new THREE.BufferAttribute(globeColors, 3));

    const globeMaterial = new THREE.PointsMaterial({
      size: 1.5,
      map: pointTexture,
      vertexColors: true,
      transparent: true,
      opacity: themeRef.current === 'dark' ? 0.92 : 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const globe = new THREE.Points(globeGeometry, globeMaterial);
    galaxyGroup.add(globe);

    // 5. Galactic Rings
    const createGalacticRing = (
      innerRadius: number,
      outerRadius: number,
      count: number,
      tintColor: number,
      tiltX: number,
      tiltZ: number
    ) => {
      const ringGeo = new THREE.BufferGeometry();
      const ringPos = new Float32Array(count * 3);
      const ringCol = new Float32Array(count * 3);
      const baseColor = new THREE.Color(tintColor);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rad = innerRadius + Math.random() * (outerRadius - innerRadius);
        const spreadY = (Math.random() - 0.5) * 3;

        ringPos[i * 3] = Math.cos(angle) * rad;
        ringPos[i * 3 + 1] = spreadY;
        ringPos[i * 3 + 2] = Math.sin(angle) * rad;

        ringCol[i * 3] = baseColor.r + (Math.random() - 0.5) * 0.15;
        ringCol[i * 3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.15;
        ringCol[i * 3 + 2] = baseColor.b;
      }

      ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
      ringGeo.setAttribute('color', new THREE.BufferAttribute(ringCol, 3));

      const ringMat = new THREE.PointsMaterial({
        size: 1.3,
        map: pointTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const ringMesh = new THREE.Points(ringGeo, ringMat);
      ringMesh.rotation.x = tiltX;
      ringMesh.rotation.z = tiltZ;
      return { mesh: ringMesh, geo: ringGeo, mat: ringMat };
    };

    const ring1 = createGalacticRing(32, 45, 1700, 0x6366f1, 0.45, 0.25);
    const ring2 = createGalacticRing(36, 50, 1300, 0x22d3ee, -0.3, -0.4);
    galaxyGroup.add(ring1.mesh);
    galaxyGroup.add(ring2.mesh);

    // 6. Background Stars
    const starsCount = 1000;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 260;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 260;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200 - 30;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.9,
      color: 0xc7d2fe,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      map: pointTexture,
      depthWrite: false,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 7. Interaction: Mouse & Touch
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (clientX: number, clientY: number) => {
      const halfWidth = window.innerWidth / 2;
      const halfHeight = window.innerHeight / 2;
      targetX = (clientX - halfWidth) * 0.0012;
      targetY = (clientY - halfHeight) * 0.0012;
    };

    const handleMouseMove = (e: MouseEvent) => {
      onPointerMove(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleResize = () => {
      updateCameraPosition();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // 8. Animation loop with Page Visibility API
    const clock = new THREE.Clock();
    let animFrameId: number | null = null;

    const animate = () => {
      if (document.hidden) return;

      animFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth damping
      mouseX += (targetX - mouseX) * 0.06;
      mouseY += (targetY - mouseY) * 0.06;

      globe.rotation.y = elapsedTime * 0.15 + mouseX;
      globe.rotation.x = Math.sin(elapsedTime * 0.08) * 0.1 + mouseY;

      ring1.mesh.rotation.y = elapsedTime * 0.07;
      ring1.mesh.rotation.z = 0.25 + Math.sin(elapsedTime * 0.2) * 0.05;

      ring2.mesh.rotation.y = -elapsedTime * 0.09;

      galaxyGroup.position.y = Math.sin(elapsedTime * 0.5) * 1.5;
      galaxyGroup.rotation.y = mouseX * 0.9;
      galaxyGroup.rotation.x = mouseY * 0.9;

      starMaterial.opacity = 0.55 + Math.sin(elapsedTime * 2.2) * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameId !== null) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      } else {
        clock.start();
        animate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 9. Cleanup
    return () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      globeGeometry.dispose();
      globeMaterial.dispose();
      ring1.geo.dispose();
      ring1.mat.dispose();
      ring2.geo.dispose();
      ring2.mat.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      pointTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="three-canvas-container"
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-0 pointer-events-auto overflow-hidden"
    />
  );
};
