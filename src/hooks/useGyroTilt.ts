import { useEffect, useState } from 'react';

type GyroTilt = {
  rotateX: number;
  rotateY: number;
  offsetX: number;
  offsetY: number;
  supported: boolean;
  requestPermission: () => Promise<void>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useGyroTilt(): GyroTilt {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  async function requestPermission() {
    const anyDeviceOrientation = DeviceOrientationEvent as any;
    if (
      typeof anyDeviceOrientation !== 'undefined' &&
      typeof anyDeviceOrientation.requestPermission === 'function'
    ) {
      const permission = await anyDeviceOrientation.requestPermission();
      if (permission === 'granted') {
        setEnabled(true);
        setSupported(true);
      }
      return;
    }
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setEnabled(true);
      setSupported(true);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('DeviceOrientationEvent' in window) {
      setSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function handleOrientation(event: DeviceOrientationEvent) {
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      const clampedBeta = clamp(beta, -20, 20);
      const clampedGamma = clamp(gamma, -20, 20);
      const rotateX = clamp(-clampedBeta / 5, -4, 4);
      const rotateY = clamp(clampedGamma / 5, -4, 4);
      const offsetX = clamp(clampedGamma / 20, -1, 1) * 12;
      const offsetY = clamp(clampedBeta / 20, -1, 1) * 12;
      setTilt({
        rotateX,
        rotateY,
        offsetX,
        offsetY,
      });
    }

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled]);

  return {
    ...tilt,
    supported,
    requestPermission,
  };
}
