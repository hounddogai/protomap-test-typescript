import * as flags from "../../../../kit/flags.js";
import { ScheduledTierScore } from "./scheduled-tier-score.js";

/** One step of the scheduled tier score calculation. */
export interface ScheduledTierScoreStep {
  describe(): string;
  adjust(item: ScheduledTierScore, value: number): number;
}

export class MinimumScheduledTierScoreAdjuster implements ScheduledTierScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledTierScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedScheduledTierScoreAdjuster implements ScheduledTierScoreStep {
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

  adjust(item: ScheduledTierScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentScheduledTierScoreAdjuster implements ScheduledTierScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ScheduledTierScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ScheduledTierScoreAmountOffsetAdjuster implements ScheduledTierScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ScheduledTierScore, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class PercentScheduledTierScoreAdjuster implements ScheduledTierScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledTierScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledTierScoreAdjuster implements ScheduledTierScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledTierScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled tier score steps in order and keeps a trace of each. */
export class ScheduledTierScoreEngine {
  steps: ScheduledTierScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledTierScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledTierScore): number {
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

  evaluateAll(items: ScheduledTierScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledTierScoreEngine(flagsValue: flags.Registry): ScheduledTierScoreEngine {
  return new ScheduledTierScoreEngine(
    [
      new MinimumScheduledTierScoreAdjuster(40.5),
      new FlaggedScheduledTierScoreAdjuster(flagsValue, "scheduled-tier-score-global", -7.3),
      new SegmentScheduledTierScoreAdjuster(new Map<string, number>([["retail", 0.84], ["south", 0.81]])),
      new ScheduledTierScoreAmountOffsetAdjuster(0.79),
      new PercentScheduledTierScoreAdjuster(-2.6),
      new TieredScheduledTierScoreAdjuster([376, 1366, 7760], [0.9, 0.8, 1.13]),
    ],
    [],
    1.3,
    96890,
  );
}
