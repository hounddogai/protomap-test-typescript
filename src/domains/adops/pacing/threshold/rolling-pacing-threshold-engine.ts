import * as numbers from "../../../../kit/numbers.js";
import { RollingPacingThreshold } from "./rolling-pacing-threshold.js";

/** One step of the rolling pacing threshold calculation. */
export interface RollingPacingThresholdAdjuster {
  describe(): string;
  adjust(item: RollingPacingThreshold, value: number): number;
}

export class RoundingRollingPacingThresholdAdjuster implements RollingPacingThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPacingThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRollingPacingThresholdAdjuster implements RollingPacingThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingPacingThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRollingPacingThresholdAdjuster implements RollingPacingThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingPacingThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRollingPacingThresholdAdjuster implements RollingPacingThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingPacingThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling pacing threshold steps in order and keeps a trace of each. */
export class RollingPacingThresholdEngine {
  steps: RollingPacingThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPacingThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingPacingThreshold): number {
    let current = item.netVolume();
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

  evaluateAll(items: RollingPacingThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingPacingThresholdEngine(): RollingPacingThresholdEngine {
  return new RollingPacingThresholdEngine(
    [
      new RoundingRollingPacingThresholdAdjuster(0.25),
      new TieredRollingPacingThresholdAdjuster([2218, 4029, 9177, 9996], [0.8, 1.1, 0.84, 1.05]),
      new MinimumRollingPacingThresholdAdjuster(8.3),
      new CapRollingPacingThresholdAdjuster(30033),
    ],
    [],
    1.6,
    3291.4,
  );
}
