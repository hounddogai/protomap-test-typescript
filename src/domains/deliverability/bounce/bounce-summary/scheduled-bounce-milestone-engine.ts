import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

/** One step of the scheduled bounce milestone calculation. */
export interface ScheduledBounceMilestoneAdjuster {
  describe(): string;
  adjust(item: ScheduledBounceMilestone, value: number): number;
}

export class PercentScheduledBounceMilestoneAdjuster implements ScheduledBounceMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledBounceMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledBounceMilestoneVersionOffsetAdjuster implements ScheduledBounceMilestoneAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ScheduledBounceMilestone, value: number): number {
    return value + item.version * this.weight;
  }
}

export class TieredScheduledBounceMilestoneAdjuster implements ScheduledBounceMilestoneAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledBounceMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedScheduledBounceMilestoneAdjuster implements ScheduledBounceMilestoneAdjuster {
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

  adjust(item: ScheduledBounceMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled bounce milestone steps in order and keeps a trace of each. */
export class ScheduledBounceMilestoneEngine {
  steps: ScheduledBounceMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledBounceMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledBounceMilestone): number {
    let current = item.netVolume();
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

  evaluateAll(items: ScheduledBounceMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledBounceMilestoneEngine(flagsValue: flags.Registry): ScheduledBounceMilestoneEngine {
  return new ScheduledBounceMilestoneEngine(
    [
      new PercentScheduledBounceMilestoneAdjuster(-20),
      new ScheduledBounceMilestoneVersionOffsetAdjuster(1.91),
      new TieredScheduledBounceMilestoneAdjuster([2126, 5994, 8720], [1.01, 1.08, 1.07]),
      new FlaggedScheduledBounceMilestoneAdjuster(flagsValue, "scheduled-bounce-milestone-rolling", 5.6),
    ],
    [],
    0,
    47156.7,
  );
}
