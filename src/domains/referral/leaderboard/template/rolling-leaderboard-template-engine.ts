import { RollingLeaderboardTemplate } from "./rolling-leaderboard-template.js";

/** One step of the rolling leaderboard template calculation. */
export interface RollingLeaderboardTemplateAdjuster {
  describe(): string;
  adjust(item: RollingLeaderboardTemplate, value: number): number;
}

export class MinimumRollingLeaderboardTemplateAdjuster implements RollingLeaderboardTemplateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingLeaderboardTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RollingLeaderboardTemplateConversionRateOffsetAdjuster implements RollingLeaderboardTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: RollingLeaderboardTemplate, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class UtmSourceRollingLeaderboardTemplateAdjuster implements RollingLeaderboardTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: RollingLeaderboardTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling leaderboard template steps in order and keeps a trace of each. */
export class RollingLeaderboardTemplateEngine {
  steps: RollingLeaderboardTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingLeaderboardTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingLeaderboardTemplate): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RollingLeaderboardTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingLeaderboardTemplateEngine(): RollingLeaderboardTemplateEngine {
  return new RollingLeaderboardTemplateEngine(
    [
      new MinimumRollingLeaderboardTemplateAdjuster(0.6),
      new RollingLeaderboardTemplateConversionRateOffsetAdjuster(0.64),
      new UtmSourceRollingLeaderboardTemplateAdjuster(
        new Map<string, number>([["east", 1.29], ["online", 0.86], ["central", 1.27]]),
      ),
    ],
    [],
    0.2,
    95609.8,
  );
}
