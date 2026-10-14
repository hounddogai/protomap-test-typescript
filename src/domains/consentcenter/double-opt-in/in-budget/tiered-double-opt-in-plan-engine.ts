import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

/** One step of the tiered double opt in plan calculation. */
export interface TieredDoubleOptInPlanModifier {
  describe(): string;
  adjust(item: TieredDoubleOptInPlan, value: number): number;
}

export class PercentTieredDoubleOptInPlanAdjuster implements TieredDoubleOptInPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredDoubleOptInPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CategoryTieredDoubleOptInPlanAdjuster implements TieredDoubleOptInPlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TieredDoubleOptInPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDoubleOptInPlanExpiresAtOffsetAdjuster implements TieredDoubleOptInPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: TieredDoubleOptInPlan, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class FlaggedTieredDoubleOptInPlanAdjuster implements TieredDoubleOptInPlanModifier {
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

  adjust(item: TieredDoubleOptInPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredDoubleOptInPlanAdjuster implements TieredDoubleOptInPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredDoubleOptInPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredDoubleOptInPlanAdjuster implements TieredDoubleOptInPlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredDoubleOptInPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered double opt in plan steps in order and keeps a trace of each. */
export class TieredDoubleOptInPlanEngine {
  steps: TieredDoubleOptInPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDoubleOptInPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredDoubleOptInPlan): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredDoubleOptInPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredDoubleOptInPlanEngine(flagsValue: flags.Registry): TieredDoubleOptInPlanEngine {
  return new TieredDoubleOptInPlanEngine(
    [
      new PercentTieredDoubleOptInPlanAdjuster(2.1),
      new CategoryTieredDoubleOptInPlanAdjuster(new Map<string, number>([["east", 1.04]])),
      new TieredDoubleOptInPlanExpiresAtOffsetAdjuster(1.05),
      new FlaggedTieredDoubleOptInPlanAdjuster(flagsValue, "tiered-double-opt-in-plan-capped", 9.9),
      new RoundingTieredDoubleOptInPlanAdjuster(5),
      new CapTieredDoubleOptInPlanAdjuster(5538),
    ],
    [],
    3.4,
    57099,
  );
}
