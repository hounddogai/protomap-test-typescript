import * as flags from "../../../../kit/flags.js";
import { SeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

/** One step of the seasonal preference threshold calculation. */
export interface SeasonalPreferenceThresholdFactor {
  describe(): string;
  adjust(item: SeasonalPreferenceThreshold, value: number): number;
}

export class MinimumSeasonalPreferenceThresholdAdjuster implements SeasonalPreferenceThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalPreferenceThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelSeasonalPreferenceThresholdAdjuster implements SeasonalPreferenceThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SeasonalPreferenceThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalPreferenceThresholdAdjuster implements SeasonalPreferenceThresholdFactor {
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

  adjust(item: SeasonalPreferenceThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalPreferenceThresholdAdjuster implements SeasonalPreferenceThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalPreferenceThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalPreferenceThresholdFloorValueOffsetAdjuster implements SeasonalPreferenceThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: SeasonalPreferenceThreshold, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the seasonal preference threshold steps in order and keeps a trace of each. */
export class SeasonalPreferenceThresholdEngine {
  steps: SeasonalPreferenceThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPreferenceThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalPreferenceThreshold): number {
    let current = item.netVolume();
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

  evaluateAll(items: SeasonalPreferenceThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalPreferenceThresholdEngine(flagsValue: flags.Registry): SeasonalPreferenceThresholdEngine {
  return new SeasonalPreferenceThresholdEngine(
    [
      new MinimumSeasonalPreferenceThresholdAdjuster(1.1),
      new LabelSeasonalPreferenceThresholdAdjuster(new Map<string, number>([["retail", 1.01]])),
      new FlaggedSeasonalPreferenceThresholdAdjuster(flagsValue, "seasonal-preference-threshold-seasonal", -3.7),
      new TieredSeasonalPreferenceThresholdAdjuster([3964, 6630], [1.1, 0.88]),
      new SeasonalPreferenceThresholdFloorValueOffsetAdjuster(0.23),
    ],
    [],
    4.4,
    89886.1,
  );
}
