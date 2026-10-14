import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgePlan } from "./badge-plan.js";

/** One step of the badge plan calculation. */
export interface BadgePlanFactor {
  describe(): string;
  adjust(item: BadgePlan, value: number): number;
}

export class MinimumBadgePlanAdjuster implements BadgePlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleBadgePlanAdjuster implements BadgePlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BadgePlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBadgePlanAdjuster implements BadgePlanFactor {
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

  adjust(item: BadgePlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBadgePlanAdjuster implements BadgePlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBadgePlanAdjuster implements BadgePlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgePlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBadgePlanAdjuster implements BadgePlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgePlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the badge plan steps in order and keeps a trace of each. */
export class BadgePlanEngine {
  steps: BadgePlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgePlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgePlan): number {
    let current = item.measuredValue();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: BadgePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgePlanEngine(flagsValue: flags.Registry): BadgePlanEngine {
  return new BadgePlanEngine(
    [
      new MinimumBadgePlanAdjuster(6.5),
      new LocaleBadgePlanAdjuster(new Map<string, number>([["south", 1.03], ["online", 1.03], ["north", 0.76]])),
      new FlaggedBadgePlanAdjuster(flagsValue, "badge-plan-rolling", 0.8),
      new CapBadgePlanAdjuster(4955),
      new TieredBadgePlanAdjuster([3149, 4080, 4940, 8164], [0.88, 0.9, 1.19, 0.93]),
      new PercentBadgePlanAdjuster(-20.5),
    ],
    [],
    4.4,
    48745.2,
  );
}
