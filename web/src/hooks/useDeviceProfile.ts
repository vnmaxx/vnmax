import { useMemo } from 'react';

export interface DeviceProfile {
  isMobile: boolean;
  lowPower: boolean;
  reducedMotion: boolean;
  effects: boolean;
  /** multiplicador geral de densidade (partículas/painéis decorativos) */
  quality: number;
  particleCount: number;
  /** nº de vértebras da coluna */
  spineSegments: number;
  dpr: [number, number];
  /** string do renderer da GPU (debug) */
  gpu: string;
}

/** Lê o renderer da GPU via WEBGL_debug_renderer_info (uma única vez). */
function readGPU(): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'none';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    // libera o contexto temporário
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return r.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Perfil de performance resolvido uma única vez.
 * Detecta GPU fraca (integrada/software) além de mobile / poucos núcleos /
 * pouca memória / prefers-reduced-motion → cena simplificada (menos
 * partículas, DPR menor, SEM bloom). Um PerformanceMonitor em runtime
 * (ExperienceCanvas) ainda derruba a carga se o FPS cair, como rede de
 * segurança para hardware que passe pela detecção estática.
 */
export function useDeviceProfile(): DeviceProfile {
  return useMemo(() => {
    const nav = typeof navigator !== 'undefined' ? navigator : ({} as Navigator);
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || /Mobi|Android/i.test(nav.userAgent || ''));

    const gpu = readGPU();
    // renderers de software / virtualizados → sempre fracos
    const softwareGPU =
      gpu === 'none' ||
      /swiftshader|llvmpipe|software|microsoft basic|paravirtual|virtualbox|vmware/i.test(gpu);
    // GPUs integradas antigas / móveis de baixo custo que engasgam com bloom
    const weakGPU =
      softwareGPU ||
      /intel.*(hd|uhd) graphics (5|6|3|4)\d{2}|intel.*(hd|uhd) graphics$|mali-[t]?[1-6]|adreno [1-4]\d{2}|powervr|videocore/i.test(
        gpu,
      );

    const lowCores = (nav.hardwareConcurrency ?? 8) <= 4;
    const lowMem = ((nav as any).deviceMemory ?? 8) <= 4;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lowPower = weakGPU || lowCores || lowMem;
    const quality = isMobile || lowPower ? 0.3 : 0.62;

    return {
      isMobile,
      lowPower,
      reducedMotion,
      // sem bloom em hardware fraco (é o maior custo por frame e o que travava
      // no pico de brilho); só ligado em máquinas com folga.
      effects: !reducedMotion && !lowPower,
      quality,
      particleCount: Math.round(3200 * quality),
      spineSegments: isMobile || lowPower ? 16 : 30,
      dpr: isMobile || lowPower ? [1, 1] : [1, 1.2],
      gpu,
    };
  }, []);
}
