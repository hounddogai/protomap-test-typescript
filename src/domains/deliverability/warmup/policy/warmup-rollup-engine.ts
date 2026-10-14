import * as numbers from "../../../../kit/numbers.js";
import { WarmupRollup } from "./warmup-rollup.js";

/** One step of the warmup rollup calculation. */
export interface WarmupRollupFactor {
  describe(): string;
  adjust(item: WarmupRollup, value: number): number;
}

export class WarmupRollupMarginOffsetAdjuster implements WarmupRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: WarmupRollup, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class RoundingWarmupRollupAdjuster implements WarmupRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWarmupRollupAdjuster implements WarmupRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWarmupRollupAdjuster implements WarmupRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the warmup rollup steps in order and keeps a trace of each. */
export class WarmupRollupEngine {
  steps: WarmupRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WarmupRollup): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: WarmupRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWarmupRollupEngine(): WarmupRollupEngine {
  return new WarmupRollupEngine(
    [
      new WarmupRollupMarginOffsetAdjuster(1.54),
      new RoundingWarmupRollupAdjuster(0.5),
      new PercentWarmupRollupAdjuster(15.4),
      new MinimumWarmupRollupAdjuster(20.2),
    ],
    [],
    3.2,
    84008.8,
  );
}
