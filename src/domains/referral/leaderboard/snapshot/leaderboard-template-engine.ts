import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardTemplate } from "./leaderboard-template.js";

/** One step of the leaderboard template calculation. */
export interface LeaderboardTemplateModifier {
  describe(): string;
  adjust(item: LeaderboardTemplate, value: number): number;
}

export class RoundingLeaderboardTemplateAdjuster implements LeaderboardTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLeaderboardTemplateAdjuster implements LeaderboardTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionLeaderboardTemplateAdjuster implements LeaderboardTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LeaderboardTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLeaderboardTemplateAdjuster implements LeaderboardTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LeaderboardTemplateDurationMinutesOffsetAdjuster implements LeaderboardTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: LeaderboardTemplate, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the leaderboard template steps in order and keeps a trace of each. */
export class LeaderboardTemplateEngine {
  steps: LeaderboardTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LeaderboardTemplate): number {
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

  evaluateAll(items: LeaderboardTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLeaderboardTemplateEngine(): LeaderboardTemplateEngine {
  return new LeaderboardTemplateEngine(
    [
      new RoundingLeaderboardTemplateAdjuster(0.5),
      new TieredLeaderboardTemplateAdjuster([4764, 6237], [0.96, 1.09]),
      new RegionLeaderboardTemplateAdjuster(
        new Map<string, number>([["north", 1.04], ["south", 1.05], ["east", 1.16]]),
      ),
      new CapLeaderboardTemplateAdjuster(15638),
      new LeaderboardTemplateDurationMinutesOffsetAdjuster(0.66),
    ],
    [],
    1.5,
    92956.9,
  );
}
