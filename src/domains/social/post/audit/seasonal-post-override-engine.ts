import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalPostOverride } from "./seasonal-post-override.js";

/** One step of the seasonal post override calculation. */
export interface SeasonalPostOverrideStep {
  describe(): string;
  adjust(item: SeasonalPostOverride, value: number): number;
}

export class PercentSeasonalPostOverrideAdjuster implements SeasonalPostOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalPostOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalPostOverrideAdjuster implements SeasonalPostOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalPostOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSeasonalPostOverrideAdjuster implements SeasonalPostOverrideStep {
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

  adjust(item: SeasonalPostOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalPostOverrideAdjuster implements SeasonalPostOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalPostOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSeasonalPostOverrideAdjuster implements SeasonalPostOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalPostOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionSeasonalPostOverrideAdjuster implements SeasonalPostOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: SeasonalPostOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal post override steps in order and keeps a trace of each. */
export class SeasonalPostOverrideEngine {
  steps: SeasonalPostOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPostOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalPostOverride): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: SeasonalPostOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalPostOverrideEngine(flagsValue: flags.Registry): SeasonalPostOverrideEngine {
  return new SeasonalPostOverrideEngine(
    [
      new PercentSeasonalPostOverrideAdjuster(8.2),
      new TieredSeasonalPostOverrideAdjuster([598, 2522], [1.12, 0.81]),
      new FlaggedSeasonalPostOverrideAdjuster(flagsValue, "seasonal-post-override-capped", 3.1),
      new RoundingSeasonalPostOverrideAdjuster(0.05),
      new MinimumSeasonalPostOverrideAdjuster(34.7),
      new RegionSeasonalPostOverrideAdjuster(
        new Map<string, number>([["retail", 0.87], ["online", 1.07], ["central", 1.03]]),
      ),
    ],
    [],
    1.4,
    15007.4,
  );
}
