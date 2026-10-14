import * as flags from "../../../../kit/flags.js";
import { TieredRewardRuleEntry } from "./tiered-reward-rule-entry.js";

/** One step of the tiered reward rule entry calculation. */
export interface TieredRewardRuleEntryModifier {
  describe(): string;
  adjust(item: TieredRewardRuleEntry, value: number): number;
}

export class FlaggedTieredRewardRuleEntryAdjuster implements TieredRewardRuleEntryModifier {
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

  adjust(item: TieredRewardRuleEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelTieredRewardRuleEntryAdjuster implements TieredRewardRuleEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredRewardRuleEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredRewardRuleEntryAdjuster implements TieredRewardRuleEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRewardRuleEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered reward rule entry steps in order and keeps a trace of each. */
export class TieredRewardRuleEntryEngine {
  steps: TieredRewardRuleEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRewardRuleEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredRewardRuleEntry): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredRewardRuleEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredRewardRuleEntryEngine(flagsValue: flags.Registry): TieredRewardRuleEntryEngine {
  return new TieredRewardRuleEntryEngine(
    [
      new FlaggedTieredRewardRuleEntryAdjuster(flagsValue, "tiered-reward-rule-entry-adaptive", -4.2),
      new LabelTieredRewardRuleEntryAdjuster(
        new Map<string, number>([["retail", 1.16], ["south", 1.37], ["online", 0.88]]),
      ),
      new MinimumTieredRewardRuleEntryAdjuster(19.9),
    ],
    [],
    3.5,
    72607.3,
  );
}
