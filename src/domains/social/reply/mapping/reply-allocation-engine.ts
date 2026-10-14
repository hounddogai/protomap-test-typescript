import * as numbers from "../../../../kit/numbers.js";
import { ReplyAllocation } from "./reply-allocation.js";

/** One step of the reply allocation calculation. */
export interface ReplyAllocationAdjuster {
  describe(): string;
  adjust(item: ReplyAllocation, value: number): number;
}

export class CapReplyAllocationAdjuster implements ReplyAllocationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ReplyAllocationCreatedAtOffsetAdjuster implements ReplyAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ReplyAllocation, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class RoundingReplyAllocationAdjuster implements ReplyAllocationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceReplyAllocationAdjuster implements ReplyAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ReplyAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredReplyAllocationAdjuster implements ReplyAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumReplyAllocationAdjuster implements ReplyAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reply allocation steps in order and keeps a trace of each. */
export class ReplyAllocationEngine {
  steps: ReplyAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyAllocation): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ReplyAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyAllocationEngine(): ReplyAllocationEngine {
  return new ReplyAllocationEngine(
    [
      new CapReplyAllocationAdjuster(36873),
      new ReplyAllocationCreatedAtOffsetAdjuster(1.15),
      new RoundingReplyAllocationAdjuster(0.5),
      new SourceReplyAllocationAdjuster(new Map<string, number>([["central", 0.83], ["east", 1.06]])),
      new TieredReplyAllocationAdjuster([510, 2994, 5902, 6281], [1.11, 0.91, 0.94, 0.94]),
      new MinimumReplyAllocationAdjuster(27.1),
    ],
    [],
    0.4,
    38088.8,
  );
}
