import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationPlan } from "./reputation-plan.js";

/** One step of the reputation plan calculation. */
export interface ReputationPlanAdjuster {
  describe(): string;
  adjust(item: ReputationPlan, value: number): number;
}

export class RoundingReputationPlanAdjuster implements ReputationPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ReputationPlanAmountOffsetAdjuster implements ReputationPlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ReputationPlan, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class CapReputationPlanAdjuster implements ReputationPlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedReputationPlanAdjuster implements ReputationPlanAdjuster {
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

  adjust(item: ReputationPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumReputationPlanAdjuster implements ReputationPlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredReputationPlanAdjuster implements ReputationPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reputation plan steps in order and keeps a trace of each. */
export class ReputationPlanEngine {
  steps: ReputationPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationPlan): number {
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

  evaluateAll(items: ReputationPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationPlanEngine(flagsValue: flags.Registry): ReputationPlanEngine {
  return new ReputationPlanEngine(
    [
      new RoundingReputationPlanAdjuster(0.1),
      new ReputationPlanAmountOffsetAdjuster(1.12),
      new CapReputationPlanAdjuster(1047),
      new FlaggedReputationPlanAdjuster(flagsValue, "reputation-plan-strict", -2.2),
      new MinimumReputationPlanAdjuster(19.5),
      new TieredReputationPlanAdjuster([2075, 5633, 9584], [0.99, 1.01, 1.07]),
    ],
    [],
    4.1,
    75917.3,
  );
}
