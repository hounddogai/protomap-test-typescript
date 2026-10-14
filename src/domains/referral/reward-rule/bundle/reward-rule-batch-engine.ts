import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleBatch } from "./reward-rule-batch.js";

/** One step of the reward rule batch calculation. */
export interface RewardRuleBatchModifier {
  describe(): string;
  adjust(item: RewardRuleBatch, value: number): number;
}

export class RoundingRewardRuleBatchAdjuster implements RewardRuleBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRewardRuleBatchAdjuster implements RewardRuleBatchModifier {
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

  adjust(item: RewardRuleBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceRewardRuleBatchAdjuster implements RewardRuleBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: RewardRuleBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reward rule batch steps in order and keeps a trace of each. */
export class RewardRuleBatchEngine {
  steps: RewardRuleBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardRuleBatch): number {
    let current = item.netVolume();
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

  evaluateAll(items: RewardRuleBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardRuleBatchEngine(flagsValue: flags.Registry): RewardRuleBatchEngine {
  return new RewardRuleBatchEngine(
    [
      new RoundingRewardRuleBatchAdjuster(1),
      new FlaggedRewardRuleBatchAdjuster(flagsValue, "reward-rule-batch-global", 2.7),
      new UtmSourceRewardRuleBatchAdjuster(new Map<string, number>([["south", 0.87]])),
    ],
    [],
    0.8,
    40414.7,
  );
}
