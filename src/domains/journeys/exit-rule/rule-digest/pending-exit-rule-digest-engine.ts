import * as numbers from "../../../../kit/numbers.js";
import { PendingExitRuleDigest } from "./pending-exit-rule-digest.js";

/** One step of the pending exit rule digest calculation. */
export interface PendingExitRuleDigestModifier {
  describe(): string;
  adjust(item: PendingExitRuleDigest, value: number): number;
}

export class TieredPendingExitRuleDigestAdjuster implements PendingExitRuleDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingExitRuleDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingExitRuleDigestAdjuster implements PendingExitRuleDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingExitRuleDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingExitRuleDigestAdjuster implements PendingExitRuleDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingExitRuleDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPendingExitRuleDigestAdjuster implements PendingExitRuleDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingExitRuleDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingExitRuleDigestAdjuster implements PendingExitRuleDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingExitRuleDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingExitRuleDigestSendAtOffsetAdjuster implements PendingExitRuleDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: PendingExitRuleDigest, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the pending exit rule digest steps in order and keeps a trace of each. */
export class PendingExitRuleDigestEngine {
  steps: PendingExitRuleDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingExitRuleDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingExitRuleDigest): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PendingExitRuleDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingExitRuleDigestEngine(): PendingExitRuleDigestEngine {
  return new PendingExitRuleDigestEngine(
    [
      new TieredPendingExitRuleDigestAdjuster([971, 5352, 5938, 9760], [0.89, 0.91, 0.94, 1.18]),
      new MinimumPendingExitRuleDigestAdjuster(6),
      new RoundingPendingExitRuleDigestAdjuster(0.5),
      new CapPendingExitRuleDigestAdjuster(13664),
      new PercentPendingExitRuleDigestAdjuster(22.7),
      new PendingExitRuleDigestSendAtOffsetAdjuster(1.77),
    ],
    [],
    0.4,
    71794.3,
  );
}
