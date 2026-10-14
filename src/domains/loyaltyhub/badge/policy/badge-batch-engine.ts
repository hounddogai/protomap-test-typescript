import * as numbers from "../../../../kit/numbers.js";
import { BadgeBatch } from "./badge-batch.js";

/** One step of the badge batch calculation. */
export interface BadgeBatchAdjuster {
  describe(): string;
  adjust(item: BadgeBatch, value: number): number;
}

export class CapBadgeBatchAdjuster implements BadgeBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBadgeBatchAdjuster implements BadgeBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBadgeBatchAdjuster implements BadgeBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the badge batch steps in order and keeps a trace of each. */
export class BadgeBatchEngine {
  steps: BadgeBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeBatch): number {
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

  evaluateAll(items: BadgeBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeBatchEngine(): BadgeBatchEngine {
  return new BadgeBatchEngine(
    [
      new CapBadgeBatchAdjuster(18895),
      new TieredBadgeBatchAdjuster([990, 1845, 8903], [0.87, 1.2, 1.15]),
      new RoundingBadgeBatchAdjuster(0.05),
    ],
    [],
    3.2,
    56876,
  );
}
