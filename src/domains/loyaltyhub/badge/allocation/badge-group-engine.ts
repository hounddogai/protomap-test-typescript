import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeGroup } from "./badge-group.js";

/** One step of the badge group calculation. */
export interface BadgeGroupFactor {
  describe(): string;
  adjust(item: BadgeGroup, value: number): number;
}

export class TieredBadgeGroupAdjuster implements BadgeGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBadgeGroupAdjuster implements BadgeGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBadgeGroupAdjuster implements BadgeGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleBadgeGroupAdjuster implements BadgeGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BadgeGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BadgeGroupRevisionOffsetAdjuster implements BadgeGroupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: BadgeGroup, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedBadgeGroupAdjuster implements BadgeGroupFactor {
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

  adjust(item: BadgeGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the badge group steps in order and keeps a trace of each. */
export class BadgeGroupEngine {
  steps: BadgeGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeGroup): number {
    let current = item.netLoad();
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

  evaluateAll(items: BadgeGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeGroupEngine(flagsValue: flags.Registry): BadgeGroupEngine {
  return new BadgeGroupEngine(
    [
      new TieredBadgeGroupAdjuster([1267, 7683, 7772], [1.03, 0.81, 1.09]),
      new PercentBadgeGroupAdjuster(-23),
      new RoundingBadgeGroupAdjuster(0.25),
      new TitleBadgeGroupAdjuster(new Map<string, number>([["west", 1.29], ["south", 1.02]])),
      new BadgeGroupRevisionOffsetAdjuster(1.73),
      new FlaggedBadgeGroupAdjuster(flagsValue, "badge-group-legacy", -8.8),
    ],
    [],
    3.2,
    58533.4,
  );
}
