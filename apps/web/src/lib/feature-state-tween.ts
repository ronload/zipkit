import type { Map as MapLibreMap } from "maplibre-gl";

export interface TweenOptions {
  /** Time for a full 0-to-1 change; smaller changes take proportionally less. */
  duration: number;
  delay?: number;
}

interface Tween {
  id: number;
  key: string;
  from: number;
  to: number;
  start: number;
  duration: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Animates numeric feature-state values of one source, which maplibre cannot
 * transition by itself. Every value is remembered, so the whole state can be
 * written back after a style change has dropped the source.
 */
export class FeatureStateTweener {
  private readonly map: MapLibreMap;
  private readonly source: string;
  private readonly values = new Map<number, Record<string, number>>();
  private readonly tweens = new Map<string, Tween>();
  private frame = 0;

  constructor(map: MapLibreMap, source: string) {
    this.map = map;
    this.source = source;
  }

  get(id: number, key: string): number {
    return this.values.get(id)?.[key] ?? 0;
  }

  /**
   * Animates toward `target`. A tween already headed there is left alone;
   * one headed elsewhere is replaced.
   */
  to(
    id: number,
    key: string,
    target: number,
    { duration, delay = 0 }: TweenOptions,
  ): void {
    const slot = `${String(id)}:${key}`;
    if (this.tweens.get(slot)?.to === target) return;
    this.tweens.delete(slot);

    const from = this.get(id, key);
    if (from === target) return;
    this.tweens.set(slot, {
      id,
      key,
      from,
      to: target,
      start: performance.now() + delay,
      duration: duration * Math.abs(target - from),
    });
    if (this.frame === 0) this.frame = requestAnimationFrame(this.tick);
  }

  /** Writes every remembered value back, e.g. after the source is re-added. */
  reapply(): void {
    if (!this.map.getSource(this.source)) return;
    for (const [id, state] of this.values) {
      this.map.setFeatureState({ source: this.source, id }, state);
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.tweens.clear();
  }

  private readonly tick = (now: number) => {
    this.frame = 0;
    for (const [slot, tween] of this.tweens) {
      if (now < tween.start) continue;
      const progress =
        tween.duration > 0
          ? Math.min(1, (now - tween.start) / tween.duration)
          : 1;
      const eased = easeInOutCubic(progress);
      this.write(
        tween.id,
        tween.key,
        tween.from + (tween.to - tween.from) * eased,
      );
      if (progress === 1) this.tweens.delete(slot);
    }
    if (this.tweens.size > 0) this.frame = requestAnimationFrame(this.tick);
  };

  private write(id: number, key: string, value: number): void {
    const state = this.values.get(id) ?? {};
    state[key] = value;
    this.values.set(id, state);
    // While the source is missing the value is only remembered; reapply()
    // writes it once the source is back.
    if (this.map.getSource(this.source)) {
      this.map.setFeatureState({ source: this.source, id }, { [key]: value });
    }
  }
}
