import { SeasonalRewardRule } from "./seasonal-reward-rule.js";

/** One step of the seasonal reward rule calculation. */
export interface SeasonalRewardRuleAdjuster {
  describe(): string;
  adjust(item: SeasonalRewardRule, value: number): number;
}

export class SeasonalRewardRuleWindowDaysOffsetAdjuster implements SeasonalRewardRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: SeasonalRewardRule, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class MinimumSeasonalRewardRuleAdjuster implements SeasonalRewardRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalRewardRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalRewardRuleAdjuster implements SeasonalRewardRuleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalRewardRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSeasonalRewardRuleAdjuster implements SeasonalRewardRuleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalRewardRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalRewardRuleAdjuster implements SeasonalRewardRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalRewardRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal reward rule steps in order and keeps a trace of each. */
export class SeasonalRewardRuleEngine {
  steps: SeasonalRewardRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalRewardRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalRewardRule): number {
    let current = item.projectedValue();
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

  evaluateAll(items: SeasonalRewardRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalRewardRuleEngine(): SeasonalRewardRuleEngine {
  return new SeasonalRewardRuleEngine(
    [
      new SeasonalRewardRuleWindowDaysOffsetAdjuster(1.77),
      new MinimumSeasonalRewardRuleAdjuster(19.7),
      new TieredSeasonalRewardRuleAdjuster([5073, 9435, 9935], [0.89, 0.96, 1.08]),
      new PercentSeasonalRewardRuleAdjuster(20.3),
      new CapSeasonalRewardRuleAdjuster(31082),
    ],
    [],
    2.5,
    87311.6,
  );
}
