import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitRule } from "./wait-rule.js";

/** One step of the wait rule calculation. */
export interface WaitRuleAdjuster {
  describe(): string;
  adjust(item: WaitRule, value: number): number;
}

export class FlaggedWaitRuleAdjuster implements WaitRuleAdjuster {
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

  adjust(item: WaitRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionWaitRuleAdjuster implements WaitRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: WaitRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWaitRuleAdjuster implements WaitRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWaitRuleAdjuster implements WaitRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the wait rule steps in order and keeps a trace of each. */
export class WaitRuleEngine {
  steps: WaitRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WaitRule): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: WaitRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWaitRuleEngine(flagsValue: flags.Registry): WaitRuleEngine {
  return new WaitRuleEngine(
    [
      new FlaggedWaitRuleAdjuster(flagsValue, "wait-rule-weighted", 0.9),
      new RegionWaitRuleAdjuster(new Map<string, number>([["south", 0.81], ["online", 1.37]])),
      new CapWaitRuleAdjuster(3928),
      new MinimumWaitRuleAdjuster(25.8),
    ],
    [],
    3.1,
    86959.4,
  );
}
