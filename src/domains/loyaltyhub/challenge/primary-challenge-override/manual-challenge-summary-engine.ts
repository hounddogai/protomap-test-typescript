import * as numbers from "../../../../kit/numbers.js";
import { ManualChallengeSummary } from "./manual-challenge-summary.js";

/** One step of the manual challenge summary calculation. */
export interface ManualChallengeSummaryModifier {
  describe(): string;
  adjust(item: ManualChallengeSummary, value: number): number;
}

export class TieredManualChallengeSummaryAdjuster implements ManualChallengeSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualChallengeSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualChallengeSummaryAdjuster implements ManualChallengeSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualChallengeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualChallengeSummaryAdjuster implements ManualChallengeSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualChallengeSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual challenge summary steps in order and keeps a trace of each. */
export class ManualChallengeSummaryEngine {
  steps: ManualChallengeSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualChallengeSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualChallengeSummary): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ManualChallengeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualChallengeSummaryEngine(): ManualChallengeSummaryEngine {
  return new ManualChallengeSummaryEngine(
    [
      new TieredManualChallengeSummaryAdjuster([1933, 3136, 9151], [0.85, 1.17, 0.87]),
      new CapManualChallengeSummaryAdjuster(46750),
      new MinimumManualChallengeSummaryAdjuster(42.1),
    ],
    [],
    0.9,
    4037.5,
  );
}
