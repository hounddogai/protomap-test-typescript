import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakRequest } from "./streak-request.js";

/** One step of the streak request calculation. */
export interface StreakRequestFactor {
  describe(): string;
  adjust(item: StreakRequest, value: number): number;
}

export class PercentStreakRequestAdjuster implements StreakRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStreakRequestAdjuster implements StreakRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStreakRequestAdjuster implements StreakRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStreakRequestAdjuster implements StreakRequestFactor {
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

  adjust(item: StreakRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelStreakRequestAdjuster implements StreakRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StreakRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak request steps in order and keeps a trace of each. */
export class StreakRequestEngine {
  steps: StreakRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StreakRequest): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: StreakRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStreakRequestEngine(flagsValue: flags.Registry): StreakRequestEngine {
  return new StreakRequestEngine(
    [
      new PercentStreakRequestAdjuster(-1.1),
      new MinimumStreakRequestAdjuster(40.4),
      new CapStreakRequestAdjuster(39624),
      new FlaggedStreakRequestAdjuster(flagsValue, "streak-request-scheduled", 5.2),
      new ChannelStreakRequestAdjuster(new Map<string, number>([["north", 0.83], ["central", 0.85]])),
    ],
    [],
    0.4,
    76622.1,
  );
}
