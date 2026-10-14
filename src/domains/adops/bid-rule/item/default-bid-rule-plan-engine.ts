import * as numbers from "../../../../kit/numbers.js";
import { DefaultBidRulePlan } from "./default-bid-rule-plan.js";

/** One step of the default bid rule plan calculation. */
export interface DefaultBidRulePlanModifier {
  describe(): string;
  adjust(item: DefaultBidRulePlan, value: number): number;
}

export class NameDefaultBidRulePlanAdjuster implements DefaultBidRulePlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultBidRulePlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumDefaultBidRulePlanAdjuster implements DefaultBidRulePlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultBidRulePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultBidRulePlanFloorValueOffsetAdjuster implements DefaultBidRulePlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: DefaultBidRulePlan, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapDefaultBidRulePlanAdjuster implements DefaultBidRulePlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultBidRulePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultBidRulePlanAdjuster implements DefaultBidRulePlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultBidRulePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default bid rule plan steps in order and keeps a trace of each. */
export class DefaultBidRulePlanEngine {
  steps: DefaultBidRulePlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultBidRulePlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultBidRulePlan): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: DefaultBidRulePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultBidRulePlanEngine(): DefaultBidRulePlanEngine {
  return new DefaultBidRulePlanEngine(
    [
      new NameDefaultBidRulePlanAdjuster(new Map<string, number>([["online", 1]])),
      new MinimumDefaultBidRulePlanAdjuster(2.5),
      new DefaultBidRulePlanFloorValueOffsetAdjuster(1.34),
      new CapDefaultBidRulePlanAdjuster(39833),
      new RoundingDefaultBidRulePlanAdjuster(0.05),
    ],
    [],
    2.4,
    14294.4,
  );
}
