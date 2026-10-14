import * as numbers from "../../../../kit/numbers.js";
import { FallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

/** One step of the fallback reward rule request calculation. */
export interface FallbackRewardRuleRequestStep {
  describe(): string;
  adjust(item: FallbackRewardRuleRequest, value: number): number;
}

export class MinimumFallbackRewardRuleRequestAdjuster implements FallbackRewardRuleRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackRewardRuleRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FallbackRewardRuleRequestPriorityOffsetAdjuster implements FallbackRewardRuleRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FallbackRewardRuleRequest, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class RoundingFallbackRewardRuleRequestAdjuster implements FallbackRewardRuleRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackRewardRuleRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryFallbackRewardRuleRequestAdjuster implements FallbackRewardRuleRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FallbackRewardRuleRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFallbackRewardRuleRequestAdjuster implements FallbackRewardRuleRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackRewardRuleRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback reward rule request steps in order and keeps a trace of each. */
export class FallbackRewardRuleRequestEngine {
  steps: FallbackRewardRuleRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRewardRuleRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackRewardRuleRequest): number {
    let current = item.netValue();
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

  evaluateAll(items: FallbackRewardRuleRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackRewardRuleRequestEngine(): FallbackRewardRuleRequestEngine {
  return new FallbackRewardRuleRequestEngine(
    [
      new MinimumFallbackRewardRuleRequestAdjuster(3),
      new FallbackRewardRuleRequestPriorityOffsetAdjuster(1.32),
      new RoundingFallbackRewardRuleRequestAdjuster(5),
      new CountryFallbackRewardRuleRequestAdjuster(new Map<string, number>([["online", 1.34]])),
      new PercentFallbackRewardRuleRequestAdjuster(-15.4),
    ],
    [],
    2.9,
    82865.4,
  );
}
