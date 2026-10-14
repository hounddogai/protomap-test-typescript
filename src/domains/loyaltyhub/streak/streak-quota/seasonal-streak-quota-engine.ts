import * as flags from "../../../../kit/flags.js";
import { SeasonalStreakQuota } from "./seasonal-streak-quota.js";

/** One step of the seasonal streak quota calculation. */
export interface SeasonalStreakQuotaModifier {
  describe(): string;
  adjust(item: SeasonalStreakQuota, value: number): number;
}

export class SegmentSeasonalStreakQuotaAdjuster implements SeasonalStreakQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SeasonalStreakQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalStreakQuotaImpressionsOffsetAdjuster implements SeasonalStreakQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: SeasonalStreakQuota, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TieredSeasonalStreakQuotaAdjuster implements SeasonalStreakQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalStreakQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSeasonalStreakQuotaAdjuster implements SeasonalStreakQuotaModifier {
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

  adjust(item: SeasonalStreakQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSeasonalStreakQuotaAdjuster implements SeasonalStreakQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalStreakQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal streak quota steps in order and keeps a trace of each. */
export class SeasonalStreakQuotaEngine {
  steps: SeasonalStreakQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalStreakQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalStreakQuota): number {
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

  evaluateAll(items: SeasonalStreakQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalStreakQuotaEngine(flagsValue: flags.Registry): SeasonalStreakQuotaEngine {
  return new SeasonalStreakQuotaEngine(
    [
      new SegmentSeasonalStreakQuotaAdjuster(new Map<string, number>([["south", 1.09]])),
      new SeasonalStreakQuotaImpressionsOffsetAdjuster(0.57),
      new TieredSeasonalStreakQuotaAdjuster([5787, 7461], [0.9, 0.89]),
      new FlaggedSeasonalStreakQuotaAdjuster(flagsValue, "seasonal-streak-quota-batched", 5.2),
      new PercentSeasonalStreakQuotaAdjuster(-24.1),
    ],
    [],
    0.6,
    15156.3,
  );
}
