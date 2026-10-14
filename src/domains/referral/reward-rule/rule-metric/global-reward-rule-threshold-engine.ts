import * as numbers from "../../../../kit/numbers.js";
import { GlobalRewardRuleThreshold } from "./global-reward-rule-threshold.js";

/** One step of the global reward rule threshold calculation. */
export interface GlobalRewardRuleThresholdModifier {
  describe(): string;
  adjust(item: GlobalRewardRuleThreshold, value: number): number;
}

export class RoundingGlobalRewardRuleThresholdAdjuster implements GlobalRewardRuleThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalRewardRuleThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalRewardRuleThresholdImpressionsOffsetAdjuster implements GlobalRewardRuleThresholdModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: GlobalRewardRuleThreshold, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class CategoryGlobalRewardRuleThresholdAdjuster implements GlobalRewardRuleThresholdModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: GlobalRewardRuleThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalRewardRuleThresholdAdjuster implements GlobalRewardRuleThresholdModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRewardRuleThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global reward rule threshold steps in order and keeps a trace of each. */
export class GlobalRewardRuleThresholdEngine {
  steps: GlobalRewardRuleThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRewardRuleThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalRewardRuleThreshold): number {
    let current = item.projectedValue();
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

  evaluateAll(items: GlobalRewardRuleThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalRewardRuleThresholdEngine(): GlobalRewardRuleThresholdEngine {
  return new GlobalRewardRuleThresholdEngine(
    [
      new RoundingGlobalRewardRuleThresholdAdjuster(5),
      new GlobalRewardRuleThresholdImpressionsOffsetAdjuster(0.69),
      new CategoryGlobalRewardRuleThresholdAdjuster(new Map<string, number>([["online", 1.18], ["west", 1.07]])),
      new CapGlobalRewardRuleThresholdAdjuster(6366),
    ],
    [],
    4.4,
    18598.3,
  );
}
