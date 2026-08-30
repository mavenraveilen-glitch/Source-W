'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

type SceneProps = {
  fetching?: boolean;
  inputFocused?: boolean;
  pulse?: number;
};

function Lattice({ fetching, inputFocused, pulse }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const ico = useRef<THREE.LineSegments>(null);
  const knot = useRef<THREE.LineSegments>(null);
  const oct = useRef<THREE.LineSegments>(null);
  const box = useRef<THREE.LineSegments>(null);
  const light = useRef<THREE.PointLight>(null);

  const mats = useMemo(
    () => ({
      ico: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }),
      knot: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }),
      oct: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
      box: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }),
    }),
    []
  );

  // Entry scale animation
  const entry = useRef({ t: 0, done: false });

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    // Entry: scale 0.1 → 1 over ~1.5s
    if (!entry.current.done) {
      entry.current.t += delta;
      const p = Math.min(1, entry.current.t / 1.5);
      // ease-out cubic
      const e = 1 - Math.pow(1 - p, 3);
      g.scale.setScalar(0.1 + e * 0.9);
      const op = e;
      mats.ico.opacity = 0.4 * op;
      mats.knot.opacity = 0.28 * op;
      mats.oct.opacity = 0.5 * op;
      mats.box.opacity = 0.12 * op;
      if (p >= 1) entry.current.done = true;
    }

    // Base auto-rotation (slow when focused, fast when fetching)
    let speed = 1;
    if (inputFocused) speed = 0.2;
    if (fetching) speed = 10;

    if (ico.current) {
      ico.current.rotation.y += 0.002 * speed;
      ico.current.rotation.x += 0.001 * speed;
    }
    if (knot.current) {
      knot.current.rotation.y -= 0.0015 * speed;
      knot.current.rotation.z += 0.002 * speed;
    }
    if (oct.current) {
      oct.current.rotation.y -= 0.004 * speed;
      oct.current.rotation.x += 0.002 * speed;
    }
    if (box.current) {
      box.current.rotation.y -= 0.001 * speed;
      box.current.rotation.x += 0.0005 * speed;
    }

    // Fetch pulse / button pulse
    if (fetching) {
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.04;
      g.scale.setScalar(1.12 * breathe);
      mats.ico.opacity = 0.45 + Math.sin(state.clock.elapsedTime * 5) * 0.25;
      mats.oct.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 5) * 0.25;
    } else if (pulse && pulse > 0) {
      const age = state.clock.elapsedTime - pulse;
      if (age < 0.4) {
        const k = Math.sin((age / 0.4) * Math.PI);
        g.scale.setScalar(1 + k * 0.05);
      } else if (entry.current.done) {
        g.scale.setScalar(1);
      }
    } else if (entry.current.done) {
      g.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
      mats.ico.opacity += (0.4 - mats.ico.opacity) * 0.05;
      mats.oct.opacity += (0.5 - mats.oct.opacity) * 0.05;
    }

    // Orbiting point light
    if (light.current) {
      const t = state.clock.elapsedTime * 0.35;
      light.current.position.set(Math.cos(t) * 5, Math.sin(t * 0.7) * 2.5, Math.sin(t) * 5);
    }
  });

  const icoGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.2, 1)), []);
  const knotGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.TorusKnotGeometry(1.15, 0.28, 128, 16)),
    []
  );
  const octGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.05, 0)), []);
  const boxGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(4.6, 4.6, 4.6)), []);

  return (
    <group ref={group} scale={0.1}>
      <lineSegments ref={ico} geometry={icoGeo} material={mats.ico} />
      <lineSegments ref={knot} geometry={knotGeo} material={mats.knot} />
      <lineSegments ref={oct} geometry={octGeo} material={mats.oct} />
      <lineSegments ref={box} geometry={boxGeo} material={mats.box} />
      <pointLight ref={light} color={0xffffff} intensity={1.2} distance={20} />
    </group>
  );
}

function Particles({ fetching }: { fetching?: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 100;

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      speeds[i] = (Math.random() - 0.5) * 0.015;
    }
    return { positions, speeds };
  }, []);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    const mul = fetching ? 4 : 1;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += speeds[i] * mul;
      if (arr[i * 3 + 2] > 8) arr[i * 3 + 2] = -8;
      if (arr[i * 3 + 2] < -8) arr[i * 3 + 2] = 8;
    }
    pts.geometry.attributes.position.needsUpdate = true;

    // Soft parallax on particle cloud
    const mx = state.pointer.x * 0.3;
    const my = state.pointer.y * 0.2;
    pts.position.x += (mx - pts.position.x) * 0.02;
    pts.position.y += (my - pts.position.y) * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={0xffffff}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function CameraRig({ fetching }: { fetching?: boolean }) {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    // Mouse parallax: ±5° Y, ±3° X roughly via position offset
    target.current.x = state.pointer.x * 0.9;
    target.current.y = state.pointer.y * 0.55;
    camera.position.x += (target.current.x - camera.position.x) * 0.04;
    camera.position.y += (target.current.y - camera.position.y) * 0.04;

    if (fetching) {
      // Zoom forward through the lattice
      camera.position.z += (3.2 - camera.position.z) * 0.04;
    } else {
      camera.position.z += (8 - camera.position.z) * 0.04;
    }
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function VolumetricScene({
  fetching = false,
  inputFocused = false,
  pulse = 0,
}: SceneProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 8], fov: 55, near: 0.1, far: 100 }}
        onCreated={({ scene, gl }) => {
          scene.fog = new THREE.FogExp2(0x000000, 0.02);
          scene.background = new THREE.Color(0x000000);
          gl.setClearColor(0x000000, 1);
        }}
      >
        <ambientLight intensity={0.15} />
        <Lattice fetching={fetching} inputFocused={inputFocused} pulse={pulse} />
        <Particles fetching={fetching} />
        <CameraRig fetching={fetching} />
        <EffectComposer>
          <Bloom intensity={1.35} luminanceThreshold={0.85} luminanceSmoothing={0.4} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
