import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalRewardRuleSlot } from "./global-reward-rule-slot.js";

/** One step of the global reward rule slot calculation. */
export interface GlobalRewardRuleSlotFactor {
  describe(): string;
  adjust(item: GlobalRewardRuleSlot, value: number): number;
}

export class RoundingGlobalRewardRuleSlotAdjuster implements GlobalRewardRuleSlotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalRewardRuleSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryGlobalRewardRuleSlotAdjuster implements GlobalRewardRuleSlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: GlobalRewardRuleSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentGlobalRewardRuleSlotAdjuster implements GlobalRewardRuleSlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRewardRuleSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalRewardRuleSlotAdjuster implements GlobalRewardRuleSlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRewardRuleSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalRewardRuleSlotAdjuster implements GlobalRewardRuleSlotFactor {
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

  adjust(item: GlobalRewardRuleSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global reward rule slot steps in order and keeps a trace of each. */
export class GlobalRewardRuleSlotEngine {
  steps: GlobalRewardRuleSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRewardRuleSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalRewardRuleSlot): number {
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

  evaluateAll(items: GlobalRewardRuleSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalRewardRuleSlotEngine(flagsValue: flags.Registry): GlobalRewardRuleSlotEngine {
  return new GlobalRewardRuleSlotEngine(
    [
      new RoundingGlobalRewardRuleSlotAdjuster(0.05),
      new CategoryGlobalRewardRuleSlotAdjuster(
        new Map<string, number>([["north", 0.74], ["online", 1.37], ["retail", 1.33]]),
      ),
      new PercentGlobalRewardRuleSlotAdjuster(-19.1),
      new CapGlobalRewardRuleSlotAdjuster(42837),
      new FlaggedGlobalRewardRuleSlotAdjuster(flagsValue, "global-reward-rule-slot-strict", 4.4),
    ],
    [],
    3.5,
    51494.8,
  );
}
