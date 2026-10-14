import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

/** One step of the seasonal cohort rollup calculation. */
export interface SeasonalCohortRollupAdjuster {
  describe(): string;
  adjust(item: SeasonalCohortRollup, value: number): number;
}

export class RoundingSeasonalCohortRollupAdjuster implements SeasonalCohortRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalCohortRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalCohortRollupAdjuster implements SeasonalCohortRollupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalCohortRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSeasonalCohortRollupAdjuster implements SeasonalCohortRollupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalCohortRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelSeasonalCohortRollupAdjuster implements SeasonalCohortRollupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SeasonalCohortRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalCohortRollupAdjuster implements SeasonalCohortRollupAdjuster {
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

  adjust(item: SeasonalCohortRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSeasonalCohortRollupAdjuster implements SeasonalCohortRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalCohortRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal cohort rollup steps in order and keeps a trace of each. */
export class SeasonalCohortRollupEngine {
  steps: SeasonalCohortRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCohortRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalCohortRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalCohortRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalCohortRollupEngine(flagsValue: flags.Registry): SeasonalCohortRollupEngine {
  return new SeasonalCohortRollupEngine(
    [
      new RoundingSeasonalCohortRollupAdjuster(1),
      new TieredSeasonalCohortRollupAdjuster([1357, 9388], [0.89, 0.88]),
      new MinimumSeasonalCohortRollupAdjuster(33.6),
      new ChannelSeasonalCohortRollupAdjuster(new Map<string, number>([["west", 1.38]])),
      new FlaggedSeasonalCohortRollupAdjuster(flagsValue, "seasonal-cohort-rollup-scheduled", 0.7),
      new PercentSeasonalCohortRollupAdjuster(-1.2),
    ],
    [],
    3.8,
    17345.8,
  );
}
