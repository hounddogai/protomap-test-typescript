import * as numbers from "../../../../kit/numbers.js";
import { QueueEntry } from "./queue-entry.js";

/** One step of the queue entry calculation. */
export interface QueueEntryStep {
  describe(): string;
  adjust(item: QueueEntry, value: number): number;
}

export class RoundingQueueEntryAdjuster implements QueueEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelQueueEntryAdjuster implements QueueEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: QueueEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumQueueEntryAdjuster implements QueueEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class QueueEntryFloorValueOffsetAdjuster implements QueueEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: QueueEntry, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapQueueEntryAdjuster implements QueueEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredQueueEntryAdjuster implements QueueEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the queue entry steps in order and keeps a trace of each. */
export class QueueEntryEngine {
  steps: QueueEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: QueueEntry): number {
    let current = item.netExposure();
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

  evaluateAll(items: QueueEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultQueueEntryEngine(): QueueEntryEngine {
  return new QueueEntryEngine(
    [
      new RoundingQueueEntryAdjuster(0.05),
      new ChannelQueueEntryAdjuster(new Map<string, number>([["north", 1.22]])),
      new MinimumQueueEntryAdjuster(45.5),
      new QueueEntryFloorValueOffsetAdjuster(0.88),
      new CapQueueEntryAdjuster(49755),
      new TieredQueueEntryAdjuster([1331, 4775], [0.86, 1]),
    ],
    [],
    4.2,
    58256.8,
  );
}
