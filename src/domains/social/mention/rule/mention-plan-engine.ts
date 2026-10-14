import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionPlan } from "./mention-plan.js";

/** One step of the mention plan calculation. */
export interface MentionPlanFactor {
  describe(): string;
  adjust(item: MentionPlan, value: number): number;
}

export class FlaggedMentionPlanAdjuster implements MentionPlanFactor {
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

  adjust(item: MentionPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingMentionPlanAdjuster implements MentionPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceMentionPlanAdjuster implements MentionPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: MentionPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredMentionPlanAdjuster implements MentionPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MentionPlanDiscountOffsetAdjuster implements MentionPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: MentionPlan, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class CapMentionPlanAdjuster implements MentionPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the mention plan steps in order and keeps a trace of each. */
export class MentionPlanEngine {
  steps: MentionPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionPlan): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: MentionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionPlanEngine(flagsValue: flags.Registry): MentionPlanEngine {
  return new MentionPlanEngine(
    [
      new FlaggedMentionPlanAdjuster(flagsValue, "mention-plan-global", 1.1),
      new RoundingMentionPlanAdjuster(0.1),
      new SourceMentionPlanAdjuster(new Map<string, number>([["north", 0.79], ["west", 1.16]])),
      new TieredMentionPlanAdjuster([2124, 4499, 4578, 5339], [1, 1.02, 0.81, 1.05]),
      new MentionPlanDiscountOffsetAdjuster(0.26),
      new CapMentionPlanAdjuster(39213),
    ],
    [],
    1.6,
    42699,
  );
}
