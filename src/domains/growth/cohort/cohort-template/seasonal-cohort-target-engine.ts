import * as numbers from "../../../../kit/numbers.js";
import { SeasonalCohortTarget } from "./seasonal-cohort-target.js";

/** One step of the seasonal cohort target calculation. */
export interface SeasonalCohortTargetModifier {
  describe(): string;
  adjust(item: SeasonalCohortTarget, value: number): number;
}

export class CountrySeasonalCohortTargetAdjuster implements SeasonalCohortTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalCohortTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalCohortTargetBatchSizeOffsetAdjuster implements SeasonalCohortTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: SeasonalCohortTarget, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class CapSeasonalCohortTargetAdjuster implements SeasonalCohortTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalCohortTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSeasonalCohortTargetAdjuster implements SeasonalCohortTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalCohortTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSeasonalCohortTargetAdjuster implements SeasonalCohortTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalCohortTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal cohort target steps in order and keeps a trace of each. */
export class SeasonalCohortTargetEngine {
  steps: SeasonalCohortTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCohortTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalCohortTarget): number {
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

  evaluateAll(items: SeasonalCohortTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalCohortTargetEngine(): SeasonalCohortTargetEngine {
  return new SeasonalCohortTargetEngine(
    [
      new CountrySeasonalCohortTargetAdjuster(new Map<string, number>([["online", 1.09]])),
      new SeasonalCohortTargetBatchSizeOffsetAdjuster(1.59),
      new CapSeasonalCohortTargetAdjuster(11606),
      new RoundingSeasonalCohortTargetAdjuster(0.05),
      new PercentSeasonalCohortTargetAdjuster(7.1),
    ],
    [],
    1.1,
    49580.2,
  );
}
