import * as numbers from "../../../../kit/numbers.js";
import { WaitSummary } from "./wait-summary.js";

/** One step of the wait summary calculation. */
export interface WaitSummaryAdjuster {
  describe(): string;
  adjust(item: WaitSummary, value: number): number;
}

export class TieredWaitSummaryAdjuster implements WaitSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWaitSummaryAdjuster implements WaitSummaryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWaitSummaryAdjuster implements WaitSummaryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the wait summary steps in order and keeps a trace of each. */
export class WaitSummaryEngine {
  steps: WaitSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WaitSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitSummaryEngine(): WaitSummaryEngine {
  return new WaitSummaryEngine(
    [
      new TieredWaitSummaryAdjuster([1987, 7056], [0.9, 1.19]),
      new CapWaitSummaryAdjuster(18111),
      new RoundingWaitSummaryAdjuster(5),
    ],
    [],
    4.9,
    68922.1,
  );
}
