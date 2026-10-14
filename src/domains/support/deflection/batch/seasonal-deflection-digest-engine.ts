import * as flags from "../../../../kit/flags.js";
import { SeasonalDeflectionDigest } from "./seasonal-deflection-digest.js";

/** One step of the seasonal deflection digest calculation. */
export interface SeasonalDeflectionDigestStep {
  describe(): string;
  adjust(item: SeasonalDeflectionDigest, value: number): number;
}

export class MinimumSeasonalDeflectionDigestAdjuster implements SeasonalDeflectionDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalDeflectionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSeasonalDeflectionDigestAdjuster implements SeasonalDeflectionDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalDeflectionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalDeflectionDigestBatchSizeOffsetAdjuster implements SeasonalDeflectionDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: SeasonalDeflectionDigest, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class FlaggedSeasonalDeflectionDigestAdjuster implements SeasonalDeflectionDigestStep {
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

  adjust(item: SeasonalDeflectionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal deflection digest steps in order and keeps a trace of each. */
export class SeasonalDeflectionDigestEngine {
  steps: SeasonalDeflectionDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDeflectionDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalDeflectionDigest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SeasonalDeflectionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalDeflectionDigestEngine(flagsValue: flags.Registry): SeasonalDeflectionDigestEngine {
  return new SeasonalDeflectionDigestEngine(
    [
      new MinimumSeasonalDeflectionDigestAdjuster(16.3),
      new CapSeasonalDeflectionDigestAdjuster(41418),
      new SeasonalDeflectionDigestBatchSizeOffsetAdjuster(1.59),
      new FlaggedSeasonalDeflectionDigestAdjuster(flagsValue, "seasonal-deflection-digest-scheduled", -3.1),
    ],
    [],
    2.1,
    49520.5,
  );
}
