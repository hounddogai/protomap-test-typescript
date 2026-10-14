import * as numbers from "../../../../kit/numbers.js";
import { DefaultMentionRule } from "./default-mention-rule.js";

/** One step of the default mention rule calculation. */
export interface DefaultMentionRuleStep {
  describe(): string;
  adjust(item: DefaultMentionRule, value: number): number;
}

export class PercentDefaultMentionRuleAdjuster implements DefaultMentionRuleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultMentionRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionDefaultMentionRuleAdjuster implements DefaultMentionRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: DefaultMentionRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDefaultMentionRuleAdjuster implements DefaultMentionRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultMentionRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default mention rule steps in order and keeps a trace of each. */
export class DefaultMentionRuleEngine {
  steps: DefaultMentionRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultMentionRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultMentionRule): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DefaultMentionRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultMentionRuleEngine(): DefaultMentionRuleEngine {
  return new DefaultMentionRuleEngine(
    [
      new PercentDefaultMentionRuleAdjuster(5.6),
      new RegionDefaultMentionRuleAdjuster(new Map<string, number>([["east", 1.13], ["north", 1.14]])),
      new RoundingDefaultMentionRuleAdjuster(5),
    ],
    [],
    0.5,
    31976.1,
  );
}
