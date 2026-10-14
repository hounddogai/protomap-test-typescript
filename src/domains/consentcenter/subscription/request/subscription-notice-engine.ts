import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionNotice } from "./subscription-notice.js";

/** One step of the subscription notice calculation. */
export interface SubscriptionNoticeModifier {
  describe(): string;
  adjust(item: SubscriptionNotice, value: number): number;
}

export class CapSubscriptionNoticeAdjuster implements SubscriptionNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSubscriptionNoticeAdjuster implements SubscriptionNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSubscriptionNoticeAdjuster implements SubscriptionNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the subscription notice steps in order and keeps a trace of each. */
export class SubscriptionNoticeEngine {
  steps: SubscriptionNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionNotice): number {
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

  evaluateAll(items: SubscriptionNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionNoticeEngine(): SubscriptionNoticeEngine {
  return new SubscriptionNoticeEngine(
    [
      new CapSubscriptionNoticeAdjuster(18412),
      new TieredSubscriptionNoticeAdjuster([3384, 4541, 5790], [0.92, 0.99, 1.09]),
      new RoundingSubscriptionNoticeAdjuster(1),
    ],
    [],
    2.7,
    67656.1,
  );
}
