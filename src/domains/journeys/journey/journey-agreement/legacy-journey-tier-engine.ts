import * as flags from "../../../../kit/flags.js";
import { LegacyJourneyTier } from "./legacy-journey-tier.js";

/** One step of the legacy journey tier calculation. */
export interface LegacyJourneyTierAdjuster {
  describe(): string;
  adjust(item: LegacyJourneyTier, value: number): number;
}

export class PercentLegacyJourneyTierAdjuster implements LegacyJourneyTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyJourneyTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyJourneyTierMaximumOffsetAdjuster implements LegacyJourneyTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: LegacyJourneyTier, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class TieredLegacyJourneyTierAdjuster implements LegacyJourneyTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyJourneyTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLegacyJourneyTierAdjuster implements LegacyJourneyTierAdjuster {
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

  adjust(item: LegacyJourneyTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy journey tier steps in order and keeps a trace of each. */
export class LegacyJourneyTierEngine {
  steps: LegacyJourneyTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyJourneyTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyJourneyTier): number {
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

  evaluateAll(items: LegacyJourneyTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyJourneyTierEngine(flagsValue: flags.Registry): LegacyJourneyTierEngine {
  return new LegacyJourneyTierEngine(
    [
      new PercentLegacyJourneyTierAdjuster(13.1),
      new LegacyJourneyTierMaximumOffsetAdjuster(0.67),
      new TieredLegacyJourneyTierAdjuster([41, 5350], [1.09, 0.96]),
      new FlaggedLegacyJourneyTierAdjuster(flagsValue, "legacy-journey-tier-primary", 2.4),
    ],
    [],
    3.5,
    48097.6,
  );
}
