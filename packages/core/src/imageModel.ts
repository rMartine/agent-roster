import { execFileSync } from 'node:child_process';
import * as os from 'node:os';

export interface HardwareInfo {
  gpu: string | null;
  vramMB: number;
  ramMB: number;
}

export interface ImageModelTier {
  minVram: number;
  model: string;
  description: string;
}

/**
 * Sorted descending by minVram. First match wins.
 * TODO: Validate these model names against Ollama's actual model library.
 * The graphic designer agent will verify/update models at generation time.
 */
export const IMAGE_MODEL_TIERS: ImageModelTier[] = [
  { minVram: 12_000, model: 'sdxl:base',        description: 'SDXL base — best quality, requires 12 GB+ VRAM' },
  { minVram:  8_000, model: 'stable-diffusion:xl-turbo', description: 'SDXL Turbo — good quality, fast inference' },
  { minVram:  4_000, model: 'stable-diffusion:v1.5',     description: 'SD 1.5 — lightweight, 4 GB VRAM minimum' },
  { minVram:      0, model: 'stable-diffusion:cpu',       description: 'SD CPU-only — no GPU required, slower' },
];

export function detectHardware(): HardwareInfo {
  const ramMB = Math.round(os.totalmem() / (1024 * 1024));

  // Try NVIDIA first
  try {
    const out = execFileSync('nvidia-smi', [
      '--query-gpu=name,memory.total',
      '--format=csv,noheader,nounits',
    ], { encoding: 'utf-8', timeout: 5_000 });

    const line = out.trim().split('\n')[0];
    if (line) {
      const [name, vramStr] = line.split(',').map(s => s.trim());
      const vramMB = parseInt(vramStr, 10);
      if (name && !Number.isNaN(vramMB)) {
        return { gpu: name, vramMB, ramMB };
      }
    }
  } catch {
    // nvidia-smi not available or failed
  }

  // TODO: Add AMD GPU detection (rocm-smi) if needed

  return { gpu: null, vramMB: 0, ramMB };
}

export function selectImageModel(vramMB: number): { model: string; description: string } {
  for (const tier of IMAGE_MODEL_TIERS) {
    if (vramMB >= tier.minVram) {
      return { model: tier.model, description: tier.description };
    }
  }
  // Fallback — should never reach here since last tier has minVram: 0
  const last = IMAGE_MODEL_TIERS[IMAGE_MODEL_TIERS.length - 1];
  return { model: last.model, description: last.description };
}
