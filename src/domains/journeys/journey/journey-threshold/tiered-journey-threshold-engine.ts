import * as flags from "../../../../kit/flags.js";
import { TieredJourneyThreshold } from "./tiered-journey-threshold.js";

/** One step of the tiered journey threshold calculation. */
export interface TieredJourneyThresholdFactor {
  describe(): string;
  adjust(item: TieredJourneyThreshold, value: number): number;
}

export class CapTieredJourneyThresholdAdjuster implements TieredJourneyThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredJourneyThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredJourneyThresholdAdjuster implements TieredJourneyThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredJourneyThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredJourneyThresholdFrequencyCapOffsetAdjuster implements TieredJourneyThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: TieredJourneyThreshold, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class FlaggedTieredJourneyThresholdAdjuster implements TieredJourneyThresholdFactor {
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

  adjust(item: TieredJourneyThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered journey threshold steps in order and keeps a trace of each. */
export class TieredJourneyThresholdEngine {
  steps: TieredJourneyThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredJourneyThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredJourneyThreshold): number {
    let current = item.netExposure();
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

  evaluateAll(items: TieredJourneyThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredJourneyThresholdEngine(flagsValue: flags.Registry): TieredJourneyThresholdEngine {
  return new TieredJourneyThresholdEngine(
    [
      new CapTieredJourneyThresholdAdjuster(15900),
      new PercentTieredJourneyThresholdAdjuster(17.7),
      new TieredJourneyThresholdFrequencyCapOffsetAdjuster(0.71),
      new FlaggedTieredJourneyThresholdAdjuster(flagsValue, "tiered-journey-threshold-regional", -1.1),
    ],
    [],
    2.1,
    39603.1,
  );
}
