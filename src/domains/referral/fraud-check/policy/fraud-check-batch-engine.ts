import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckBatch } from "./fraud-check-batch.js";

/** One step of the fraud check batch calculation. */
export interface FraudCheckBatchAdjuster {
  describe(): string;
  adjust(item: FraudCheckBatch, value: number): number;
}

export class MinimumFraudCheckBatchAdjuster implements FraudCheckBatchAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFraudCheckBatchAdjuster implements FraudCheckBatchAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: FraudCheckBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFraudCheckBatchAdjuster implements FraudCheckBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFraudCheckBatchAdjuster implements FraudCheckBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFraudCheckBatchAdjuster implements FraudCheckBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFraudCheckBatchAdjuster implements FraudCheckBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fraud check batch steps in order and keeps a trace of each. */
export class FraudCheckBatchEngine {
  steps: FraudCheckBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FraudCheckBatch): number {
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

  evaluateAll(items: FraudCheckBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFraudCheckBatchEngine(flagsValue: flags.Registry): FraudCheckBatchEngine {
  return new FraudCheckBatchEngine(
    [
      new MinimumFraudCheckBatchAdjuster(10.7),
      new FlaggedFraudCheckBatchAdjuster(flagsValue, "fraud-check-batch-legacy", -3.1),
      new CapFraudCheckBatchAdjuster(27738),
      new TieredFraudCheckBatchAdjuster([1363, 2702, 5704], [0.88, 0.84, 1]),
      new RoundingFraudCheckBatchAdjuster(0.25),
      new PercentFraudCheckBatchAdjuster(8.4),
    ],
    [],
    3.4,
    51902.5,
  );
}
