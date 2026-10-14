import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPostScore } from "./scheduled-post-score.js";

/** One step of the scheduled post score calculation. */
export interface ScheduledPostScoreStep {
  describe(): string;
  adjust(item: ScheduledPostScore, value: number): number;
}

export class FlaggedScheduledPostScoreAdjuster implements ScheduledPostScoreStep {
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

  adjust(item: ScheduledPostScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledPostScoreAdjuster implements ScheduledPostScoreStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPostScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledPostScoreAdjuster implements ScheduledPostScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledPostScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledPostScoreAdjuster implements ScheduledPostScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledPostScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled post score steps in order and keeps a trace of each. */
export class ScheduledPostScoreEngine {
  steps: ScheduledPostScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPostScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledPostScore): number {
    let current = item.adjustedTotal();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ScheduledPostScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledPostScoreEngine(flagsValue: flags.Registry): ScheduledPostScoreEngine {
  return new ScheduledPostScoreEngine(
    [
      new FlaggedScheduledPostScoreAdjuster(flagsValue, "scheduled-post-score-strict", 3.8),
      new CapScheduledPostScoreAdjuster(49974),
      new MinimumScheduledPostScoreAdjuster(8.5),
      new TieredScheduledPostScoreAdjuster([11, 1497, 2408, 4468], [0.93, 1, 1.01, 1.15]),
    ],
    [],
    4.6,
    50651.8,
  );
}
