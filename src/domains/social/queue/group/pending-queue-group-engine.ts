import * as numbers from "../../../../kit/numbers.js";
import { PendingQueueGroup } from "./pending-queue-group.js";

/** One step of the pending queue group calculation. */
export interface PendingQueueGroupAdjuster {
  describe(): string;
  adjust(item: PendingQueueGroup, value: number): number;
}

export class MinimumPendingQueueGroupAdjuster implements PendingQueueGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingQueueGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingQueueGroupAdjuster implements PendingQueueGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingQueueGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingQueueGroupAdjuster implements PendingQueueGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingQueueGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending queue group steps in order and keeps a trace of each. */
export class PendingQueueGroupEngine {
  steps: PendingQueueGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingQueueGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingQueueGroup): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PendingQueueGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingQueueGroupEngine(): PendingQueueGroupEngine {
  return new PendingQueueGroupEngine(
    [
      new MinimumPendingQueueGroupAdjuster(17.3),
      new TieredPendingQueueGroupAdjuster([487, 7842, 9770], [0.88, 1.15, 0.87]),
      new RoundingPendingQueueGroupAdjuster(0.5),
    ],
    [],
    4.5,
    28864.9,
  );
}
