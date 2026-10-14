import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDomainPlan } from "./seasonal-domain-plan.js";

/** One step of the seasonal domain plan calculation. */
export interface SeasonalDomainPlanFactor {
  describe(): string;
  adjust(item: SeasonalDomainPlan, value: number): number;
}

export class MinimumSeasonalDomainPlanAdjuster implements SeasonalDomainPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalDomainPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitSeasonalDomainPlanAdjuster implements SeasonalDomainPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: SeasonalDomainPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalDomainPlanAdjuster implements SeasonalDomainPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalDomainPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSeasonalDomainPlanAdjuster implements SeasonalDomainPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalDomainPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSeasonalDomainPlanAdjuster implements SeasonalDomainPlanFactor {
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

  adjust(item: SeasonalDomainPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalDomainPlanAdjuster implements SeasonalDomainPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalDomainPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal domain plan steps in order and keeps a trace of each. */
export class SeasonalDomainPlanEngine {
  steps: SeasonalDomainPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDomainPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalDomainPlan): number {
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

  evaluateAll(items: SeasonalDomainPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalDomainPlanEngine(flagsValue: flags.Registry): SeasonalDomainPlanEngine {
  return new SeasonalDomainPlanEngine(
    [
      new MinimumSeasonalDomainPlanAdjuster(39.6),
      new UnitSeasonalDomainPlanAdjuster(new Map<string, number>([["west", 0.87], ["retail", 1.3]])),
      new TieredSeasonalDomainPlanAdjuster([431, 2147, 2634], [1.14, 1.12, 1.18]),
      new CapSeasonalDomainPlanAdjuster(17298),
      new FlaggedSeasonalDomainPlanAdjuster(flagsValue, "seasonal-domain-plan-capped", 1.9),
      new RoundingSeasonalDomainPlanAdjuster(1),
    ],
    [],
    3.8,
    13764.4,
  );
}
