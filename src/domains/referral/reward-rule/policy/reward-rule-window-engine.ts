import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleWindow } from "./reward-rule-window.js";

/** One step of the reward rule window calculation. */
export interface RewardRuleWindowFactor {
  describe(): string;
  adjust(item: RewardRuleWindow, value: number): number;
}

export class RoundingRewardRuleWindowAdjuster implements RewardRuleWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRewardRuleWindowAdjuster implements RewardRuleWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRewardRuleWindowAdjuster implements RewardRuleWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RewardRuleWindowWindowDaysOffsetAdjuster implements RewardRuleWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RewardRuleWindow, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class PercentRewardRuleWindowAdjuster implements RewardRuleWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule window steps in order and keeps a trace of each. */
export class RewardRuleWindowEngine {
  steps: RewardRuleWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleWindow): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RewardRuleWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleWindowEngine(): RewardRuleWindowEngine {
  return new RewardRuleWindowEngine(
    [
      new RoundingRewardRuleWindowAdjuster(1),
      new CapRewardRuleWindowAdjuster(45434),
      new MinimumRewardRuleWindowAdjuster(12.8),
      new RewardRuleWindowWindowDaysOffsetAdjuster(0.42),
      new PercentRewardRuleWindowAdjuster(22.2),
    ],
    [],
    1.7,
    67781.5,
  );
}
