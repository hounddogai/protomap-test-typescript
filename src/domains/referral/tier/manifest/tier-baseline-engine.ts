import * as numbers from "../../../../kit/numbers.js";
import { TierBaseline } from "./tier-baseline.js";

/** One step of the tier baseline calculation. */
export interface TierBaselineFactor {
  describe(): string;
  adjust(item: TierBaseline, value: number): number;
}

export class PercentTierBaselineAdjuster implements TierBaselineFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTierBaselineAdjuster implements TierBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TierBaselineScoreOffsetAdjuster implements TierBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TierBaseline, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the tier baseline steps in order and keeps a trace of each. */
export class TierBaselineEngine {
  steps: TierBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierBaseline): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TierBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierBaselineEngine(): TierBaselineEngine {
  return new TierBaselineEngine(
    [
      new PercentTierBaselineAdjuster(24.8),
      new CapTierBaselineAdjuster(14860),
      new TierBaselineScoreOffsetAdjuster(0.46),
    ],
    [],
    4.1,
    78536.7,
  );
}
