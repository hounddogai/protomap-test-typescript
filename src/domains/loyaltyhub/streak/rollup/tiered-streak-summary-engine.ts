import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredStreakSummary } from "./tiered-streak-summary.js";

/** One step of the tiered streak summary calculation. */
export interface TieredStreakSummaryFactor {
  describe(): string;
  adjust(item: TieredStreakSummary, value: number): number;
}

export class MinimumTieredStreakSummaryAdjuster implements TieredStreakSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredStreakSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredStreakSummaryAdjuster implements TieredStreakSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredStreakSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredStreakSummaryAdjuster implements TieredStreakSummaryFactor {
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

  adjust(item: TieredStreakSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredStreakSummaryAdjuster implements TieredStreakSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredStreakSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStreakSummaryFrequencyCapOffsetAdjuster implements TieredStreakSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: TieredStreakSummary, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class CapTieredStreakSummaryAdjuster implements TieredStreakSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredStreakSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered streak summary steps in order and keeps a trace of each. */
export class TieredStreakSummaryEngine {
  steps: TieredStreakSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredStreakSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredStreakSummary): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: TieredStreakSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredStreakSummaryEngine(flagsValue: flags.Registry): TieredStreakSummaryEngine {
  return new TieredStreakSummaryEngine(
    [
      new MinimumTieredStreakSummaryAdjuster(8),
      new PercentTieredStreakSummaryAdjuster(-21.9),
      new FlaggedTieredStreakSummaryAdjuster(flagsValue, "tiered-streak-summary-fallback", -2.8),
      new RoundingTieredStreakSummaryAdjuster(1),
      new TieredStreakSummaryFrequencyCapOffsetAdjuster(0.13),
      new CapTieredStreakSummaryAdjuster(31189),
    ],
    [],
    1.5,
    59558.9,
  );
}
