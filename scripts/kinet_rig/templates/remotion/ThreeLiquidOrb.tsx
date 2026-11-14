import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const ThreeLiquidOrb: React.FC<{
  frame: number;
  fps: number;
  orbScale: number;
  ringsScale: number;
  roughness: number;
}> = ({ frame, fps, orbScale, ringsScale, roughness }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    orbMesh: THREE.Mesh;
    orbMat: THREE.MeshPhysicalMaterial;
    ringMesh1: THREE.Mesh;
    ringMesh2: THREE.Mesh;
    origPositions: THREE.BufferAttribute;
    orbGeo: THREE.IcosahedronGeometry;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = 1920;
    const height = 1080;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Spatial Lighting exactly from kinet-ios-liquid-glass.html
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0a84ff, 3.5);
    dirLight1.position.set(5, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff375f, 2.8);
    dirLight2.position.set(-5, -3, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x64d2ff, 4, 15);
    pointLight.position.set(0, 0, 3.5);
    scene.add(pointLight);

    // Liquid Orb Mesh
    const orbGeo = new THREE.IcosahedronGeometry(2.1, 48);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.95,
      ior: 1.48,
      thickness: 2.2,
      specularIntensity: 1.0,
      specularColor: 0xffffff,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.98,
    });
    const orbMesh = new THREE.Mesh(orbGeo, orbMat);
    scene.add(orbMesh);

    // Concentric Spatial VisionOS Rings
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x64d2ff,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
    });
    const ringGeo1 = new THREE.RingGeometry(2.6, 2.64, 64);
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 2.4;
    scene.add(ringMesh1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xbf5af2,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const ringGeo2 = new THREE.RingGeometry(3.1, 3.14, 64);
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 1.9;
    ringMesh2.rotation.y = Math.PI / 6;
    scene.add(ringMesh2);

    const origPositions = orbGeo.attributes.position.clone() as THREE.BufferAttribute;

    stateRef.current = {
      renderer,
      scene,
      camera,
      orbMesh,
      orbMat,
      ringMesh1,
      ringMesh2,
      origPositions,
      orbGeo,
    };

    mountRef.current.appendChild(renderer.domElement);

    return () => {
      renderer.dispose();
      orbGeo.dispose();
      orbMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update on each frame deterministically
  useEffect(() => {
    if (!stateRef.current) return;
    const { renderer, scene, camera, orbMesh, orbMat, ringMesh1, ringMesh2, origPositions, orbGeo } = stateRef.current;

    const t = frame / fps;
    const time = t * 2.5;

    // Fluid Mesh Deformation from exact updateFluidMesh(t)
    const pos = orbGeo.attributes.position;
    const count = pos.count;

    for (let i = 0; i < count; i++) {
      const ox = origPositions.getX(i);
      const oy = origPositions.getY(i);
      const oz = origPositions.getZ(i);

      const wave1 = Math.sin(ox * 2.2 + time) * 0.16;
      const wave2 = Math.cos(oy * 2.8 + time * 1.3) * 0.14;
      const wave3 = Math.sin((ox + oz) * 1.8 + time * 0.9) * 0.12;
      const displacement = 1.0 + wave1 + wave2 + wave3;

      pos.setXYZ(i, ox * displacement, oy * displacement, oz * displacement);
    }
    pos.needsUpdate = true;
    orbGeo.computeVertexNormals();

    // Rotations & Scale
    orbMesh.scale.set(orbScale, orbScale, orbScale);
    orbMesh.rotation.y = t * 0.35;
    orbMesh.rotation.x = Math.sin(t * 0.25) * 0.2;

    ringMesh1.scale.set(ringsScale, ringsScale, ringsScale);
    ringMesh2.scale.set(ringsScale, ringsScale, ringsScale);
    ringMesh1.rotation.z = -t * 0.4;
    ringMesh2.rotation.z = t * 0.25;
    ringMesh2.rotation.x = Math.PI / 1.9 + Math.sin(t * 0.3) * 0.15;

    orbMat.roughness = roughness;

    renderer.render(scene, camera);
  }, [frame, fps, orbScale, ringsScale, roughness]);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }} />;
};
