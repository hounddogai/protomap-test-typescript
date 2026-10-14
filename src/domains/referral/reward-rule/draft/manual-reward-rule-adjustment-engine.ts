import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

/** One step of the manual reward rule adjustment calculation. */
export interface ManualRewardRuleAdjustmentStep {
  describe(): string;
  adjust(item: ManualRewardRuleAdjustment, value: number): number;
}

export class FlaggedManualRewardRuleAdjustmentAdjuster implements ManualRewardRuleAdjustmentStep {
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

  adjust(item: ManualRewardRuleAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualRewardRuleAdjustmentBudgetOffsetAdjuster implements ManualRewardRuleAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ManualRewardRuleAdjustment, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingManualRewardRuleAdjustmentAdjuster implements ManualRewardRuleAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRewardRuleAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionManualRewardRuleAdjustmentAdjuster implements ManualRewardRuleAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ManualRewardRuleAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualRewardRuleAdjustmentAdjuster implements ManualRewardRuleAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRewardRuleAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualRewardRuleAdjustmentAdjuster implements ManualRewardRuleAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRewardRuleAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual reward rule adjustment steps in order and keeps a trace of each. */
export class ManualRewardRuleAdjustmentEngine {
  steps: ManualRewardRuleAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRewardRuleAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualRewardRuleAdjustment): number {
    let current = item.weightedValue();
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

  evaluateAll(items: ManualRewardRuleAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualRewardRuleAdjustmentEngine(flagsValue: flags.Registry): ManualRewardRuleAdjustmentEngine {
  return new ManualRewardRuleAdjustmentEngine(
    [
      new FlaggedManualRewardRuleAdjustmentAdjuster(flagsValue, "manual-reward-rule-adjustment-rolling", -7.8),
      new ManualRewardRuleAdjustmentBudgetOffsetAdjuster(1.93),
      new RoundingManualRewardRuleAdjustmentAdjuster(0.5),
      new RegionManualRewardRuleAdjustmentAdjuster(
        new Map<string, number>([["online", 1.31], ["south", 1.19], ["east", 1.05]]),
      ),
      new PercentManualRewardRuleAdjustmentAdjuster(-20.1),
      new CapManualRewardRuleAdjustmentAdjuster(32237),
    ],
    [],
    3.9,
    67123.3,
  );
}
