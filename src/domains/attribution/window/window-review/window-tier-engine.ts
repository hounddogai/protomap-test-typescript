import * as numbers from "../../../../kit/numbers.js";
import { WindowTier } from "./window-tier.js";

/** One step of the window tier calculation. */
export interface WindowTierStep {
  describe(): string;
  adjust(item: WindowTier, value: number): number;
}

export class CapWindowTierAdjuster implements WindowTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWindowTierAdjuster implements WindowTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleWindowTierAdjuster implements WindowTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WindowTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the window tier steps in order and keeps a trace of each. */
export class WindowTierEngine {
  steps: WindowTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowTier): number {
    let current = item.netValue();
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

  evaluateAll(items: WindowTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowTierEngine(): WindowTierEngine {
  return new WindowTierEngine(
    [
      new CapWindowTierAdjuster(10901),
      new MinimumWindowTierAdjuster(36.9),
      new TitleWindowTierAdjuster(new Map<string, number>([["central", 1.38], ["retail", 0.99]])),
    ],
    [],
    1.8,
    90182.7,
  );
}
