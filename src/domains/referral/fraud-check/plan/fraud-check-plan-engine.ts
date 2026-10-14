import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckPlan } from "./fraud-check-plan.js";

/** One step of the fraud check plan calculation. */
export interface FraudCheckPlanStep {
  describe(): string;
  adjust(item: FraudCheckPlan, value: number): number;
}

export class FraudCheckPlanPriorityOffsetAdjuster implements FraudCheckPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FraudCheckPlan, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapFraudCheckPlanAdjuster implements FraudCheckPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelFraudCheckPlanAdjuster implements FraudCheckPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FraudCheckPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFraudCheckPlanAdjuster implements FraudCheckPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFraudCheckPlanAdjuster implements FraudCheckPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFraudCheckPlanAdjuster implements FraudCheckPlanStep {
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

  adjust(item: FraudCheckPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fraud check plan steps in order and keeps a trace of each. */
export class FraudCheckPlanEngine {
  steps: FraudCheckPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FraudCheckPlan): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: FraudCheckPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFraudCheckPlanEngine(flagsValue: flags.Registry): FraudCheckPlanEngine {
  return new FraudCheckPlanEngine(
    [
      new FraudCheckPlanPriorityOffsetAdjuster(0.27),
      new CapFraudCheckPlanAdjuster(8869),
      new LabelFraudCheckPlanAdjuster(
        new Map<string, number>([["south", 1.15], ["online", 0.88], ["central", 0.75]]),
      ),
      new MinimumFraudCheckPlanAdjuster(10.6),
      new TieredFraudCheckPlanAdjuster([7525, 9295], [1.02, 0.83]),
      new FlaggedFraudCheckPlanAdjuster(flagsValue, "fraud-check-plan-fallback", 0.6),
    ],
    [],
    1.8,
    86286.4,
  );
}
