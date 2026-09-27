import { useState, useEffect } from 'react';

export type DeviceOrientationType = 'portrait' | 'landscape';

export interface DeviceOrientationState {
  orientation: DeviceOrientationType;
  isLandscape: boolean;
  isPortrait: boolean;
  angle: number;
}

/**
 * Hook to track device orientation in real-time across mobile phones, tablets, and desktops.
 * Automatically attempts to unlock screen orientation so user can freely rotate device.
 */
export function useDeviceOrientation(): DeviceOrientationState {
  const getOrientationState = (): DeviceOrientationState => {
    if (typeof window === 'undefined') {
      return {
        orientation: 'portrait',
        isLandscape: false,
        isPortrait: true,
        angle: 0,
      };
    }

    let angle = 0;
    let isLandscape = false;

    // Check modern Screen Orientation API
    if (window.screen && window.screen.orientation) {
      angle = window.screen.orientation.angle || 0;
      isLandscape = window.screen.orientation.type.startsWith('landscape');
    } else if (typeof window.orientation === 'number') {
      // Fallback for older iOS / Android WebViews
      angle = window.orientation;
      isLandscape = Math.abs(window.orientation) === 90;
    } else {
      // Fallback to viewport aspect ratio
      isLandscape = window.innerWidth > window.innerHeight;
    }

    const orientation: DeviceOrientationType = isLandscape ? 'landscape' : 'portrait';

    return {
      orientation,
      isLandscape,
      isPortrait: !isLandscape,
      angle,
    };
  };

  const [orientationState, setOrientationState] = useState<DeviceOrientationState>(getOrientationState);

  useEffect(() => {
    // Attempt programmatic orientation unlock (restores system auto-rotate)
    const tryUnlock = () => {
      if (typeof window !== 'undefined' && window.screen?.orientation) {
        try {
          if (typeof window.screen.orientation.unlock === 'function') {
            window.screen.orientation.unlock();
          }
        } catch {
          // Some browsers throw if not supported
        }
      }
    };

    tryUnlock();

    const handleOrientationChange = () => {
      tryUnlock();
      setOrientationState(getOrientationState());
    };

    // Modern screen orientation change event
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Traditional window orientation and resize events
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientationState;
}
