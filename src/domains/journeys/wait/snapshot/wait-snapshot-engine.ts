import * as numbers from "../../../../kit/numbers.js";
import { WaitSnapshot } from "./wait-snapshot.js";

/** One step of the wait snapshot calculation. */
export interface WaitSnapshotStep {
  describe(): string;
  adjust(item: WaitSnapshot, value: number): number;
}

export class MinimumWaitSnapshotAdjuster implements WaitSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WaitSnapshotGraceDaysOffsetAdjuster implements WaitSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: WaitSnapshot, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class TieredWaitSnapshotAdjuster implements WaitSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWaitSnapshotAdjuster implements WaitSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWaitSnapshotAdjuster implements WaitSnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleWaitSnapshotAdjuster implements WaitSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WaitSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the wait snapshot steps in order and keeps a trace of each. */
export class WaitSnapshotEngine {
  steps: WaitSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitSnapshot): number {
    let current = item.weightedValue();
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

  evaluateAll(items: WaitSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitSnapshotEngine(): WaitSnapshotEngine {
  return new WaitSnapshotEngine(
    [
      new MinimumWaitSnapshotAdjuster(14.8),
      new WaitSnapshotGraceDaysOffsetAdjuster(0.6),
      new TieredWaitSnapshotAdjuster([956, 3067, 4172, 9019], [1.03, 0.98, 1.07, 0.8]),
      new PercentWaitSnapshotAdjuster(16.4),
      new CapWaitSnapshotAdjuster(1644),
      new LocaleWaitSnapshotAdjuster(
        new Map<string, number>([["retail", 1.4], ["south", 1.12], ["central", 0.75]]),
      ),
    ],
    [],
    0.2,
    24660.2,
  );
}
