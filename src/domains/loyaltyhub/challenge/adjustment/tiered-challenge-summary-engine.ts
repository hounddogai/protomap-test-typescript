import * as numbers from "../../../../kit/numbers.js";
import { TieredChallengeSummary } from "./tiered-challenge-summary.js";

/** One step of the tiered challenge summary calculation. */
export interface TieredChallengeSummaryStep {
  describe(): string;
  adjust(item: TieredChallengeSummary, value: number): number;
}

export class CapTieredChallengeSummaryAdjuster implements TieredChallengeSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredChallengeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredChallengeSummaryAdjuster implements TieredChallengeSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredChallengeSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredChallengeSummaryAdjuster implements TieredChallengeSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredChallengeSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredChallengeSummaryAdjuster implements TieredChallengeSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredChallengeSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredChallengeSummaryAdjuster implements TieredChallengeSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredChallengeSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelTieredChallengeSummaryAdjuster implements TieredChallengeSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredChallengeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered challenge summary steps in order and keeps a trace of each. */
export class TieredChallengeSummaryEngine {
  steps: TieredChallengeSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredChallengeSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredChallengeSummary): number {
    let current = item.netVolume();
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

  evaluateAll(items: TieredChallengeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredChallengeSummaryEngine(): TieredChallengeSummaryEngine {
  return new TieredChallengeSummaryEngine(
    [
      new CapTieredChallengeSummaryAdjuster(49541),
      new TieredTieredChallengeSummaryAdjuster([1334, 6690, 8149, 8230], [0.93, 1.16, 0.96, 0.91]),
      new MinimumTieredChallengeSummaryAdjuster(38),
      new PercentTieredChallengeSummaryAdjuster(-10.8),
      new RoundingTieredChallengeSummaryAdjuster(0.5),
      new LabelTieredChallengeSummaryAdjuster(new Map<string, number>([["north", 0.79]])),
    ],
    [],
    2.2,
    17169.7,
  );
}
