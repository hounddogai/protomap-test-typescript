import * as numbers from "../../../../kit/numbers.js";
import { BidRuleManifest } from "./bid-rule-manifest.js";

/** One step of the bid rule manifest calculation. */
export interface BidRuleManifestFactor {
  describe(): string;
  adjust(item: BidRuleManifest, value: number): number;
}

export class PercentBidRuleManifestAdjuster implements BidRuleManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBidRuleManifestAdjuster implements BidRuleManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBidRuleManifestAdjuster implements BidRuleManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBidRuleManifestAdjuster implements BidRuleManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bid rule manifest steps in order and keeps a trace of each. */
export class BidRuleManifestEngine {
  steps: BidRuleManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BidRuleManifest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: BidRuleManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBidRuleManifestEngine(): BidRuleManifestEngine {
  return new BidRuleManifestEngine(
    [
      new PercentBidRuleManifestAdjuster(22.3),
      new RoundingBidRuleManifestAdjuster(0.25),
      new MinimumBidRuleManifestAdjuster(14),
      new CapBidRuleManifestAdjuster(17580),
    ],
    [],
    2.6,
    29133.7,
  );
}
