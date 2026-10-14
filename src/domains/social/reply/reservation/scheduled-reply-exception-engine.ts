import * as numbers from "../../../../kit/numbers.js";
import { ScheduledReplyException } from "./scheduled-reply-exception.js";

/** One step of the scheduled reply exception calculation. */
export interface ScheduledReplyExceptionFactor {
  describe(): string;
  adjust(item: ScheduledReplyException, value: number): number;
}

export class NameScheduledReplyExceptionAdjuster implements ScheduledReplyExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledReplyException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredScheduledReplyExceptionAdjuster implements ScheduledReplyExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledReplyException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledReplyExceptionAdjuster implements ScheduledReplyExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledReplyException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledReplyExceptionRateOffsetAdjuster implements ScheduledReplyExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ScheduledReplyException, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class CapScheduledReplyExceptionAdjuster implements ScheduledReplyExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledReplyException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledReplyExceptionAdjuster implements ScheduledReplyExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledReplyException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled reply exception steps in order and keeps a trace of each. */
export class ScheduledReplyExceptionEngine {
  steps: ScheduledReplyExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledReplyExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledReplyException): number {
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

  evaluateAll(items: ScheduledReplyException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledReplyExceptionEngine(): ScheduledReplyExceptionEngine {
  return new ScheduledReplyExceptionEngine(
    [
      new NameScheduledReplyExceptionAdjuster(
        new Map<string, number>([["west", 1.37], ["central", 1.11], ["retail", 1.03]]),
      ),
      new TieredScheduledReplyExceptionAdjuster([5907, 6908], [1.06, 1.19]),
      new RoundingScheduledReplyExceptionAdjuster(0.05),
      new ScheduledReplyExceptionRateOffsetAdjuster(0.31),
      new CapScheduledReplyExceptionAdjuster(13067),
      new PercentScheduledReplyExceptionAdjuster(22.1),
    ],
    [],
    3.5,
    52873.6,
  );
}
