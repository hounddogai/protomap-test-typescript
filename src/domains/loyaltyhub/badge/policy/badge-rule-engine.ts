import * as numbers from "../../../../kit/numbers.js";
import { BadgeRule } from "./badge-rule.js";

/** One step of the badge rule calculation. */
export interface BadgeRuleAdjuster {
  describe(): string;
  adjust(item: BadgeRule, value: number): number;
}

export class CapBadgeRuleAdjuster implements BadgeRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBadgeRuleAdjuster implements BadgeRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBadgeRuleAdjuster implements BadgeRuleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelBadgeRuleAdjuster implements BadgeRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BadgeRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BadgeRuleRetriesOffsetAdjuster implements BadgeRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: BadgeRule, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the badge rule steps in order and keeps a trace of each. */
export class BadgeRuleEngine {
  steps: BadgeRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeRule): number {
    let current = item.netExposure();
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

  evaluateAll(items: BadgeRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeRuleEngine(): BadgeRuleEngine {
  return new BadgeRuleEngine(
    [
      new CapBadgeRuleAdjuster(44050),
      new MinimumBadgeRuleAdjuster(0.2),
      new RoundingBadgeRuleAdjuster(0.25),
      new LabelBadgeRuleAdjuster(new Map<string, number>([["south", 1.08]])),
      new BadgeRuleRetriesOffsetAdjuster(0.95),
    ],
    [],
    3,
    83384.3,
  );
}
