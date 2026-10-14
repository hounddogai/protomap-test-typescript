import * as numbers from "../../../../kit/numbers.js";
import { TieredTierBaseline } from "./tiered-tier-baseline.js";

/** One step of the tiered tier baseline calculation. */
export interface TieredTierBaselineAdjuster {
  describe(): string;
  adjust(item: TieredTierBaseline, value: number): number;
}

export class MinimumTieredTierBaselineAdjuster implements TieredTierBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredTierBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredTierBaselineAdjuster implements TieredTierBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredTierBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameTieredTierBaselineAdjuster implements TieredTierBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredTierBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredTierBaselineAdjuster implements TieredTierBaselineAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredTierBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered tier baseline steps in order and keeps a trace of each. */
export class TieredTierBaselineEngine {
  steps: TieredTierBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTierBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredTierBaseline): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: TieredTierBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredTierBaselineEngine(): TieredTierBaselineEngine {
  return new TieredTierBaselineEngine(
    [
      new MinimumTieredTierBaselineAdjuster(18.6),
      new PercentTieredTierBaselineAdjuster(6.6),
      new NameTieredTierBaselineAdjuster(new Map<string, number>([["south", 0.88]])),
      new CapTieredTierBaselineAdjuster(23056),
    ],
    [],
    0.5,
    53432.1,
  );
}
