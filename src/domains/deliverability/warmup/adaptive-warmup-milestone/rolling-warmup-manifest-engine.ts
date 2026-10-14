import * as numbers from "../../../../kit/numbers.js";
import { RollingWarmupManifest } from "./rolling-warmup-manifest.js";

/** One step of the rolling warmup manifest calculation. */
export interface RollingWarmupManifestModifier {
  describe(): string;
  adjust(item: RollingWarmupManifest, value: number): number;
}

export class RoundingRollingWarmupManifestAdjuster implements RollingWarmupManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWarmupManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingWarmupManifestAdjuster implements RollingWarmupManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingWarmupManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingWarmupManifestAdjuster implements RollingWarmupManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingWarmupManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingWarmupManifestAdjuster implements RollingWarmupManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingWarmupManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling warmup manifest steps in order and keeps a trace of each. */
export class RollingWarmupManifestEngine {
  steps: RollingWarmupManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWarmupManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingWarmupManifest): number {
    let current = item.adjustedExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: RollingWarmupManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingWarmupManifestEngine(): RollingWarmupManifestEngine {
  return new RollingWarmupManifestEngine(
    [
      new RoundingRollingWarmupManifestAdjuster(0.5),
      new MinimumRollingWarmupManifestAdjuster(23.2),
      new PercentRollingWarmupManifestAdjuster(-6.6),
      new CapRollingWarmupManifestAdjuster(30160),
    ],
    [],
    0.4,
    61906.4,
  );
}
