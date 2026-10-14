import * as numbers from "../../../../kit/numbers.js";
import { QueueRecord } from "./queue-record.js";

/** One step of the queue record calculation. */
export interface QueueRecordModifier {
  describe(): string;
  adjust(item: QueueRecord, value: number): number;
}

export class TieredQueueRecordAdjuster implements QueueRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingQueueRecordAdjuster implements QueueRecordModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumQueueRecordAdjuster implements QueueRecordModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentQueueRecordAdjuster implements QueueRecordModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceQueueRecordAdjuster implements QueueRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: QueueRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapQueueRecordAdjuster implements QueueRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the queue record steps in order and keeps a trace of each. */
export class QueueRecordEngine {
  steps: QueueRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: QueueRecord): number {
    let current = item.weightedVolume();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: QueueRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultQueueRecordEngine(): QueueRecordEngine {
  return new QueueRecordEngine(
    [
      new TieredQueueRecordAdjuster([4302, 6144, 6155], [0.93, 1.05, 0.9]),
      new RoundingQueueRecordAdjuster(0.1),
      new MinimumQueueRecordAdjuster(3.2),
      new PercentQueueRecordAdjuster(1.9),
      new UtmSourceQueueRecordAdjuster(new Map<string, number>([["east", 0.88], ["retail", 1.03]])),
      new CapQueueRecordAdjuster(22337),
    ],
    [],
    3.9,
    60739.3,
  );
}
