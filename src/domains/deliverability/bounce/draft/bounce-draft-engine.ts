import * as numbers from "../../../../kit/numbers.js";
import { BounceDraft } from "./bounce-draft.js";

/** One step of the bounce draft calculation. */
export interface BounceDraftStep {
  describe(): string;
  adjust(item: BounceDraft, value: number): number;
}

export class MinimumBounceDraftAdjuster implements BounceDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBounceDraftAdjuster implements BounceDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBounceDraftAdjuster implements BounceDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBounceDraftAdjuster implements BounceDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionBounceDraftAdjuster implements BounceDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BounceDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBounceDraftAdjuster implements BounceDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bounce draft steps in order and keeps a trace of each. */
export class BounceDraftEngine {
  steps: BounceDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BounceDraft): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BounceDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBounceDraftEngine(): BounceDraftEngine {
  return new BounceDraftEngine(
    [
      new MinimumBounceDraftAdjuster(40.5),
      new RoundingBounceDraftAdjuster(0.1),
      new TieredBounceDraftAdjuster([3136, 6949, 7397, 8750], [0.86, 1.17, 0.82, 1.17]),
      new PercentBounceDraftAdjuster(-14.7),
      new RegionBounceDraftAdjuster(new Map<string, number>([["west", 0.97], ["central", 0.71]])),
      new CapBounceDraftAdjuster(34264),
    ],
    [],
    1,
    24184.7,
  );
}
