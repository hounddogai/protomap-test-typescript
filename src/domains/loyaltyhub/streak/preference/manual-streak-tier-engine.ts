import * as numbers from "../../../../kit/numbers.js";
import { ManualStreakTier } from "./manual-streak-tier.js";

/** One step of the manual streak tier calculation. */
export interface ManualStreakTierModifier {
  describe(): string;
  adjust(item: ManualStreakTier, value: number): number;
}

export class CapManualStreakTierAdjuster implements ManualStreakTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualStreakTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ManualStreakTierAmountOffsetAdjuster implements ManualStreakTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ManualStreakTier, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class LocaleManualStreakTierAdjuster implements ManualStreakTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualStreakTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualStreakTierAdjuster implements ManualStreakTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualStreakTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual streak tier steps in order and keeps a trace of each. */
export class ManualStreakTierEngine {
  steps: ManualStreakTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualStreakTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualStreakTier): number {
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

  evaluateAll(items: ManualStreakTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualStreakTierEngine(): ManualStreakTierEngine {
  return new ManualStreakTierEngine(
    [
      new CapManualStreakTierAdjuster(30693),
      new ManualStreakTierAmountOffsetAdjuster(0.09),
      new LocaleManualStreakTierAdjuster(new Map<string, number>([["east", 1.05], ["west", 1.18]])),
      new MinimumManualStreakTierAdjuster(14.8),
    ],
    [],
    1.2,
    40103.9,
  );
}
