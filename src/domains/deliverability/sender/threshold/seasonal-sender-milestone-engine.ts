import * as numbers from "../../../../kit/numbers.js";
import { SeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

/** One step of the seasonal sender milestone calculation. */
export interface SeasonalSenderMilestoneAdjuster {
  describe(): string;
  adjust(item: SeasonalSenderMilestone, value: number): number;
}

export class PercentSeasonalSenderMilestoneAdjuster implements SeasonalSenderMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalSenderMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalSenderMilestoneAdjuster implements SeasonalSenderMilestoneAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalSenderMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalSenderMilestoneAdjuster implements SeasonalSenderMilestoneAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalSenderMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentSeasonalSenderMilestoneAdjuster implements SeasonalSenderMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SeasonalSenderMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal sender milestone steps in order and keeps a trace of each. */
export class SeasonalSenderMilestoneEngine {
  steps: SeasonalSenderMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSenderMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalSenderMilestone): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: SeasonalSenderMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalSenderMilestoneEngine(): SeasonalSenderMilestoneEngine {
  return new SeasonalSenderMilestoneEngine(
    [
      new PercentSeasonalSenderMilestoneAdjuster(6.1),
      new RoundingSeasonalSenderMilestoneAdjuster(0.25),
      new TieredSeasonalSenderMilestoneAdjuster([4929, 9242], [0.99, 1]),
      new SegmentSeasonalSenderMilestoneAdjuster(
        new Map<string, number>([["central", 0.83], ["east", 1.31], ["south", 1.26]]),
      ),
    ],
    [],
    1.9,
    30427.8,
  );
}
