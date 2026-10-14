import * as numbers from "../../../../kit/numbers.js";
import { SeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

/** One step of the seasonal invite milestone calculation. */
export interface SeasonalInviteMilestoneStep {
  describe(): string;
  adjust(item: SeasonalInviteMilestone, value: number): number;
}

export class RoundingSeasonalInviteMilestoneAdjuster implements SeasonalInviteMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalInviteMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalInviteMilestoneAdjuster implements SeasonalInviteMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalInviteMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSeasonalInviteMilestoneAdjuster implements SeasonalInviteMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalInviteMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalInviteMilestoneAdjuster implements SeasonalInviteMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalInviteMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleSeasonalInviteMilestoneAdjuster implements SeasonalInviteMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SeasonalInviteMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal invite milestone steps in order and keeps a trace of each. */
export class SeasonalInviteMilestoneEngine {
  steps: SeasonalInviteMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalInviteMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalInviteMilestone): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: SeasonalInviteMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalInviteMilestoneEngine(): SeasonalInviteMilestoneEngine {
  return new SeasonalInviteMilestoneEngine(
    [
      new RoundingSeasonalInviteMilestoneAdjuster(0.1),
      new TieredSeasonalInviteMilestoneAdjuster([4358, 5075], [0.94, 0.99]),
      new CapSeasonalInviteMilestoneAdjuster(14865),
      new MinimumSeasonalInviteMilestoneAdjuster(10),
      new TitleSeasonalInviteMilestoneAdjuster(
        new Map<string, number>([["south", 1.26], ["west", 1.17], ["east", 0.8]]),
      ),
    ],
    [],
    3.8,
    12546.8,
  );
}
