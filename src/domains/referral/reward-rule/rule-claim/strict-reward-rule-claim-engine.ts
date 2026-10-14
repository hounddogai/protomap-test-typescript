import * as numbers from "../../../../kit/numbers.js";
import { StrictRewardRuleClaim } from "./strict-reward-rule-claim.js";

/** One step of the strict reward rule claim calculation. */
export interface StrictRewardRuleClaimModifier {
  describe(): string;
  adjust(item: StrictRewardRuleClaim, value: number): number;
}

export class CapStrictRewardRuleClaimAdjuster implements StrictRewardRuleClaimModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictRewardRuleClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StrictRewardRuleClaimStartsAtOffsetAdjuster implements StrictRewardRuleClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: StrictRewardRuleClaim, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class NameStrictRewardRuleClaimAdjuster implements StrictRewardRuleClaimModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictRewardRuleClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict reward rule claim steps in order and keeps a trace of each. */
export class StrictRewardRuleClaimEngine {
  steps: StrictRewardRuleClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictRewardRuleClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictRewardRuleClaim): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: StrictRewardRuleClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictRewardRuleClaimEngine(): StrictRewardRuleClaimEngine {
  return new StrictRewardRuleClaimEngine(
    [
      new CapStrictRewardRuleClaimAdjuster(32302),
      new StrictRewardRuleClaimStartsAtOffsetAdjuster(1.04),
      new NameStrictRewardRuleClaimAdjuster(new Map<string, number>([["north", 0.71], ["retail", 1.4]])),
    ],
    [],
    0.5,
    45830.1,
  );
}
