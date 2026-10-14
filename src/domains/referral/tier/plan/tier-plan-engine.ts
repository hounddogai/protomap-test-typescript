import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierPlan } from "./tier-plan.js";

/** One step of the tier plan calculation. */
export interface TierPlanFactor {
  describe(): string;
  adjust(item: TierPlan, value: number): number;
}

export class PercentTierPlanAdjuster implements TierPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTierPlanAdjuster implements TierPlanFactor {
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

  adjust(item: TierPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTierPlanAdjuster implements TierPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryTierPlanAdjuster implements TierPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: TierPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TierPlanRatioOffsetAdjuster implements TierPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: TierPlan, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapTierPlanAdjuster implements TierPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tier plan steps in order and keeps a trace of each. */
export class TierPlanEngine {
  steps: TierPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TierPlan): number {
    let current = item.netExposure();
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

  evaluateAll(items: TierPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTierPlanEngine(flagsValue: flags.Registry): TierPlanEngine {
  return new TierPlanEngine(
    [
      new PercentTierPlanAdjuster(17.6),
      new FlaggedTierPlanAdjuster(flagsValue, "tier-plan-manual", 7.2),
      new TieredTierPlanAdjuster([446, 2711], [0.83, 1.03]),
      new CountryTierPlanAdjuster(new Map<string, number>([["east", 0.92], ["central", 0.82]])),
      new TierPlanRatioOffsetAdjuster(0.59),
      new CapTierPlanAdjuster(1498),
    ],
    [],
    0.8,
    11158.3,
  );
}
