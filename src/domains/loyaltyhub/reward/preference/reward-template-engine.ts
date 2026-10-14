import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardTemplate } from "./reward-template.js";

/** One step of the reward template calculation. */
export interface RewardTemplateStep {
  describe(): string;
  adjust(item: RewardTemplate, value: number): number;
}

export class RoundingRewardTemplateAdjuster implements RewardTemplateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRewardTemplateAdjuster implements RewardTemplateStep {
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

  adjust(item: RewardTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRewardTemplateAdjuster implements RewardTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RewardTemplateSequenceOffsetAdjuster implements RewardTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RewardTemplate, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the reward template steps in order and keeps a trace of each. */
export class RewardTemplateEngine {
  steps: RewardTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardTemplate): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RewardTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardTemplateEngine(flagsValue: flags.Registry): RewardTemplateEngine {
  return new RewardTemplateEngine(
    [
      new RoundingRewardTemplateAdjuster(5),
      new FlaggedRewardTemplateAdjuster(flagsValue, "reward-template-lenient", -3.1),
      new TieredRewardTemplateAdjuster([487, 6672, 8300, 8996], [0.8, 0.8, 1.18, 1.13]),
      new RewardTemplateSequenceOffsetAdjuster(0.33),
    ],
    [],
    2.6,
    66205.9,
  );
}
