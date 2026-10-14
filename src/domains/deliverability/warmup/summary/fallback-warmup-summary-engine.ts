import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackWarmupSummary } from "./fallback-warmup-summary.js";

/** One step of the fallback warmup summary calculation. */
export interface FallbackWarmupSummaryModifier {
  describe(): string;
  adjust(item: FallbackWarmupSummary, value: number): number;
}

export class FallbackWarmupSummaryGraceDaysOffsetAdjuster implements FallbackWarmupSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: FallbackWarmupSummary, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapFallbackWarmupSummaryAdjuster implements FallbackWarmupSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackWarmupSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackWarmupSummaryAdjuster implements FallbackWarmupSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackWarmupSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackWarmupSummaryAdjuster implements FallbackWarmupSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackWarmupSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumFallbackWarmupSummaryAdjuster implements FallbackWarmupSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackWarmupSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFallbackWarmupSummaryAdjuster implements FallbackWarmupSummaryModifier {
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

  adjust(item: FallbackWarmupSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback warmup summary steps in order and keeps a trace of each. */
export class FallbackWarmupSummaryEngine {
  steps: FallbackWarmupSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackWarmupSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackWarmupSummary): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: FallbackWarmupSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackWarmupSummaryEngine(flagsValue: flags.Registry): FallbackWarmupSummaryEngine {
  return new FallbackWarmupSummaryEngine(
    [
      new FallbackWarmupSummaryGraceDaysOffsetAdjuster(0.91),
      new CapFallbackWarmupSummaryAdjuster(28080),
      new PercentFallbackWarmupSummaryAdjuster(-9.1),
      new RoundingFallbackWarmupSummaryAdjuster(0.25),
      new MinimumFallbackWarmupSummaryAdjuster(41.6),
      new FlaggedFallbackWarmupSummaryAdjuster(flagsValue, "fallback-warmup-summary-scheduled", 6.6),
    ],
    [],
    4.3,
    88292.7,
  );
}
