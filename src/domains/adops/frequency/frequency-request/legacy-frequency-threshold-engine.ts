import * as flags from "../../../../kit/flags.js";
import { LegacyFrequencyThreshold } from "./legacy-frequency-threshold.js";

/** One step of the legacy frequency threshold calculation. */
export interface LegacyFrequencyThresholdAdjuster {
  describe(): string;
  adjust(item: LegacyFrequencyThreshold, value: number): number;
}

export class ChannelLegacyFrequencyThresholdAdjuster implements LegacyFrequencyThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyFrequencyThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLegacyFrequencyThresholdAdjuster implements LegacyFrequencyThresholdAdjuster {
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

  adjust(item: LegacyFrequencyThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyFrequencyThresholdAdjuster implements LegacyFrequencyThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFrequencyThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy frequency threshold steps in order and keeps a trace of each. */
export class LegacyFrequencyThresholdEngine {
  steps: LegacyFrequencyThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFrequencyThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyFrequencyThreshold): number {
    let current = item.netTotal();
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

  evaluateAll(items: LegacyFrequencyThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyFrequencyThresholdEngine(flagsValue: flags.Registry): LegacyFrequencyThresholdEngine {
  return new LegacyFrequencyThresholdEngine(
    [
      new ChannelLegacyFrequencyThresholdAdjuster(new Map<string, number>([["west", 0.97], ["online", 0.75]])),
      new FlaggedLegacyFrequencyThresholdAdjuster(flagsValue, "legacy-frequency-threshold-seasonal", 7.9),
      new TieredLegacyFrequencyThresholdAdjuster([3727, 5276, 5400], [1.05, 0.87, 1.05]),
    ],
    [],
    1.7,
    24105.9,
  );
}
