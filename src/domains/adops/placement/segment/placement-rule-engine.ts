import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PlacementRule } from "./placement-rule.js";

/** One step of the placement rule calculation. */
export interface PlacementRuleFactor {
  describe(): string;
  adjust(item: PlacementRule, value: number): number;
}

export class CapPlacementRuleAdjuster implements PlacementRuleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPlacementRuleAdjuster implements PlacementRuleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPlacementRuleAdjuster implements PlacementRuleFactor {
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

  adjust(item: PlacementRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelPlacementRuleAdjuster implements PlacementRuleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PlacementRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the placement rule steps in order and keeps a trace of each. */
export class PlacementRuleEngine {
  steps: PlacementRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PlacementRule): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PlacementRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPlacementRuleEngine(flagsValue: flags.Registry): PlacementRuleEngine {
  return new PlacementRuleEngine(
    [
      new CapPlacementRuleAdjuster(49887),
      new MinimumPlacementRuleAdjuster(35.5),
      new FlaggedPlacementRuleAdjuster(flagsValue, "placement-rule-global", 1.8),
      new LabelPlacementRuleAdjuster(
        new Map<string, number>([["east", 1.31], ["south", 0.91], ["online", 1.15]]),
      ),
    ],
    [],
    4.3,
    25042.9,
  );
}
