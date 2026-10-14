import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationBatch } from "./activation-batch.js";

/** One step of the activation batch calculation. */
export interface ActivationBatchFactor {
  describe(): string;
  adjust(item: ActivationBatch, value: number): number;
}

export class TieredActivationBatchAdjuster implements ActivationBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedActivationBatchAdjuster implements ActivationBatchFactor {
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

  adjust(item: ActivationBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapActivationBatchAdjuster implements ActivationBatchFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumActivationBatchAdjuster implements ActivationBatchFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ActivationBatchPriorityOffsetAdjuster implements ActivationBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: ActivationBatch, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the activation batch steps in order and keeps a trace of each. */
export class ActivationBatchEngine {
  steps: ActivationBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationBatch): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ActivationBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationBatchEngine(flagsValue: flags.Registry): ActivationBatchEngine {
  return new ActivationBatchEngine(
    [
      new TieredActivationBatchAdjuster([375, 1084, 2202, 5614], [0.99, 0.86, 1.1, 1.04]),
      new FlaggedActivationBatchAdjuster(flagsValue, "activation-batch-weighted", 7),
      new CapActivationBatchAdjuster(26463),
      new MinimumActivationBatchAdjuster(25.5),
      new ActivationBatchPriorityOffsetAdjuster(0.69),
    ],
    [],
    3.5,
    40639.3,
  );
}
