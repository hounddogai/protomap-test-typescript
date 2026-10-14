import * as numbers from "../../../../kit/numbers.js";
import { ManualChallengeBatch } from "./manual-challenge-batch.js";

/** One step of the manual challenge batch calculation. */
export interface ManualChallengeBatchModifier {
  describe(): string;
  adjust(item: ManualChallengeBatch, value: number): number;
}

export class TieredManualChallengeBatchAdjuster implements ManualChallengeBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualChallengeBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualChallengeBatchAdjuster implements ManualChallengeBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualChallengeBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualChallengeBatchAdjuster implements ManualChallengeBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualChallengeBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual challenge batch steps in order and keeps a trace of each. */
export class ManualChallengeBatchEngine {
  steps: ManualChallengeBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualChallengeBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualChallengeBatch): number {
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

  evaluateAll(items: ManualChallengeBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualChallengeBatchEngine(): ManualChallengeBatchEngine {
  return new ManualChallengeBatchEngine(
    [
      new TieredManualChallengeBatchAdjuster([1042, 2859, 5459], [1.2, 0.81, 1.09]),
      new CapManualChallengeBatchAdjuster(2068),
      new PercentManualChallengeBatchAdjuster(-1.5),
    ],
    [],
    4.7,
    81644.4,
  );
}
