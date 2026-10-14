import * as numbers from "../../../../kit/numbers.js";
import { ManualConversionTier } from "./manual-conversion-tier.js";

/** One step of the manual conversion tier calculation. */
export interface ManualConversionTierStep {
  describe(): string;
  adjust(item: ManualConversionTier, value: number): number;
}

export class PercentManualConversionTierAdjuster implements ManualConversionTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualConversionTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualConversionTierAdjuster implements ManualConversionTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualConversionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelManualConversionTierAdjuster implements ManualConversionTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ManualConversionTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualConversionTierAdjuster implements ManualConversionTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualConversionTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual conversion tier steps in order and keeps a trace of each. */
export class ManualConversionTierEngine {
  steps: ManualConversionTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualConversionTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualConversionTier): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ManualConversionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualConversionTierEngine(): ManualConversionTierEngine {
  return new ManualConversionTierEngine(
    [
      new PercentManualConversionTierAdjuster(12.1),
      new CapManualConversionTierAdjuster(22990),
      new ChannelManualConversionTierAdjuster(new Map<string, number>([["east", 1.33], ["south", 1.31]])),
      new MinimumManualConversionTierAdjuster(43.5),
    ],
    [],
    0.7,
    20461.9,
  );
}
