import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalActivationTier } from "./seasonal-activation-tier.js";

/** One step of the seasonal activation tier calculation. */
export interface SeasonalActivationTierAdjuster {
  describe(): string;
  adjust(item: SeasonalActivationTier, value: number): number;
}

export class TieredSeasonalActivationTierAdjuster implements SeasonalActivationTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalActivationTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalActivationTierAdjuster implements SeasonalActivationTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalActivationTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SeasonalActivationTierScoreOffsetAdjuster implements SeasonalActivationTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: SeasonalActivationTier, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CategorySeasonalActivationTierAdjuster implements SeasonalActivationTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: SeasonalActivationTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalActivationTierAdjuster implements SeasonalActivationTierAdjuster {
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

  adjust(item: SeasonalActivationTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal activation tier steps in order and keeps a trace of each. */
export class SeasonalActivationTierEngine {
  steps: SeasonalActivationTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalActivationTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalActivationTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalActivationTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalActivationTierEngine(flagsValue: flags.Registry): SeasonalActivationTierEngine {
  return new SeasonalActivationTierEngine(
    [
      new TieredSeasonalActivationTierAdjuster([2942, 8818], [0.84, 1.03]),
      new RoundingSeasonalActivationTierAdjuster(0.5),
      new SeasonalActivationTierScoreOffsetAdjuster(0.57),
      new CategorySeasonalActivationTierAdjuster(
        new Map<string, number>([["retail", 1.09], ["west", 0.86], ["online", 0.77]]),
      ),
      new FlaggedSeasonalActivationTierAdjuster(flagsValue, "seasonal-activation-tier-weighted", -5.5),
    ],
    [],
    4.5,
    18230.3,
  );
}
