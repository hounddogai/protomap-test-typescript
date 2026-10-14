import * as numbers from "../../../../kit/numbers.js";
import { GlobalMacroThreshold } from "./global-macro-threshold.js";

/** One step of the global macro threshold calculation. */
export interface GlobalMacroThresholdModifier {
  describe(): string;
  adjust(item: GlobalMacroThreshold, value: number): number;
}

export class CapGlobalMacroThresholdAdjuster implements GlobalMacroThresholdModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalMacroThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredGlobalMacroThresholdAdjuster implements GlobalMacroThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalMacroThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumGlobalMacroThresholdAdjuster implements GlobalMacroThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalMacroThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalMacroThresholdAdjuster implements GlobalMacroThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalMacroThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global macro threshold steps in order and keeps a trace of each. */
export class GlobalMacroThresholdEngine {
  steps: GlobalMacroThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalMacroThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalMacroThreshold): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: GlobalMacroThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalMacroThresholdEngine(): GlobalMacroThresholdEngine {
  return new GlobalMacroThresholdEngine(
    [
      new CapGlobalMacroThresholdAdjuster(38792),
      new TieredGlobalMacroThresholdAdjuster([9118, 9280], [1.05, 0.91]),
      new MinimumGlobalMacroThresholdAdjuster(2.6),
      new PercentGlobalMacroThresholdAdjuster(21.9),
    ],
    [],
    0.4,
    41655.1,
  );
}
