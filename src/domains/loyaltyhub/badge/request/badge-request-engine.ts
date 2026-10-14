import * as flags from "../../../../kit/flags.js";
import { BadgeRequest } from "./badge-request.js";

/** One step of the badge request calculation. */
export interface BadgeRequestFactor {
  describe(): string;
  adjust(item: BadgeRequest, value: number): number;
}

export class CapBadgeRequestAdjuster implements BadgeRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BadgeRequestConversionRateOffsetAdjuster implements BadgeRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: BadgeRequest, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class FlaggedBadgeRequestAdjuster implements BadgeRequestFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BadgeRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBadgeRequestAdjuster implements BadgeRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBadgeRequestAdjuster implements BadgeRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CategoryBadgeRequestAdjuster implements BadgeRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BadgeRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the badge request steps in order and keeps a trace of each. */
export class BadgeRequestEngine {
  steps: BadgeRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BadgeRequest): number {
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

  evaluateAll(items: BadgeRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBadgeRequestEngine(flagsValue: flags.Registry): BadgeRequestEngine {
  return new BadgeRequestEngine(
    [
      new CapBadgeRequestAdjuster(31159),
      new BadgeRequestConversionRateOffsetAdjuster(0.79),
      new FlaggedBadgeRequestAdjuster(flagsValue, "badge-request-lenient", 7.9),
      new TieredBadgeRequestAdjuster([3194, 6896, 9284], [0.91, 0.94, 1.08]),
      new PercentBadgeRequestAdjuster(23.9),
      new CategoryBadgeRequestAdjuster(new Map<string, number>([["north", 1.14]])),
    ],
    [],
    1.9,
    13559.7,
  );
}
