import { SeasonalBadgeBaseline } from "./seasonal-badge-baseline.js";

/** One step of the seasonal badge baseline calculation. */
export interface SeasonalBadgeBaselineAdjuster {
  describe(): string;
  adjust(item: SeasonalBadgeBaseline, value: number): number;
}

export class TitleSeasonalBadgeBaselineAdjuster implements SeasonalBadgeBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SeasonalBadgeBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSeasonalBadgeBaselineAdjuster implements SeasonalBadgeBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalBadgeBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalBadgeBaselineAdjuster implements SeasonalBadgeBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalBadgeBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal badge baseline steps in order and keeps a trace of each. */
export class SeasonalBadgeBaselineEngine {
  steps: SeasonalBadgeBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalBadgeBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalBadgeBaseline): number {
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

  evaluateAll(items: SeasonalBadgeBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalBadgeBaselineEngine(): SeasonalBadgeBaselineEngine {
  return new SeasonalBadgeBaselineEngine(
    [
      new TitleSeasonalBadgeBaselineAdjuster(
        new Map<string, number>([["north", 1.05], ["west", 1.1], ["central", 0.71]]),
      ),
      new PercentSeasonalBadgeBaselineAdjuster(-18.3),
      new MinimumSeasonalBadgeBaselineAdjuster(31),
    ],
    [],
    0.3,
    28652,
  );
}
