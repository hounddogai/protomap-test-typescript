import * as numbers from "../../../../kit/numbers.js";
import { QueueGroup } from "./queue-group.js";

/** One step of the queue group calculation. */
export interface QueueGroupFactor {
  describe(): string;
  adjust(item: QueueGroup, value: number): number;
}

export class PercentQueueGroupAdjuster implements QueueGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredQueueGroupAdjuster implements QueueGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapQueueGroupAdjuster implements QueueGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelQueueGroupAdjuster implements QueueGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: QueueGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class QueueGroupBudgetOffsetAdjuster implements QueueGroupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: QueueGroup, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumQueueGroupAdjuster implements QueueGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the queue group steps in order and keeps a trace of each. */
export class QueueGroupEngine {
  steps: QueueGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueueGroup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: QueueGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueueGroupEngine(): QueueGroupEngine {
  return new QueueGroupEngine(
    [
      new PercentQueueGroupAdjuster(-14.1),
      new TieredQueueGroupAdjuster([1207, 2913, 4358], [1.1, 1.13, 1.19]),
      new CapQueueGroupAdjuster(16378),
      new ChannelQueueGroupAdjuster(new Map<string, number>([["central", 0.84]])),
      new QueueGroupBudgetOffsetAdjuster(1.07),
      new MinimumQueueGroupAdjuster(25.4),
    ],
    [],
    1.5,
    69019.9,
  );
}
