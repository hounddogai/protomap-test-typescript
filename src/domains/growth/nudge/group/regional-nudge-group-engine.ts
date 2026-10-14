import * as flags from "../../../../kit/flags.js";
import { RegionalNudgeGroup } from "./regional-nudge-group.js";

/** One step of the regional nudge group calculation. */
export interface RegionalNudgeGroupStep {
  describe(): string;
  adjust(item: RegionalNudgeGroup, value: number): number;
}

export class FlaggedRegionalNudgeGroupAdjuster implements RegionalNudgeGroupStep {
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

  adjust(item: RegionalNudgeGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalNudgeGroupAdjuster implements RegionalNudgeGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalNudgeGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalNudgeGroupAdjuster implements RegionalNudgeGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalNudgeGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalNudgeGroupAdjuster implements RegionalNudgeGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalNudgeGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional nudge group steps in order and keeps a trace of each. */
export class RegionalNudgeGroupEngine {
  steps: RegionalNudgeGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalNudgeGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalNudgeGroup): number {
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

  evaluateAll(items: RegionalNudgeGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalNudgeGroupEngine(flagsValue: flags.Registry): RegionalNudgeGroupEngine {
  return new RegionalNudgeGroupEngine(
    [
      new FlaggedRegionalNudgeGroupAdjuster(flagsValue, "regional-nudge-group-global", -3.8),
      new PercentRegionalNudgeGroupAdjuster(20),
      new CapRegionalNudgeGroupAdjuster(35662),
      new MinimumRegionalNudgeGroupAdjuster(37.2),
    ],
    [],
    1,
    79712.7,
  );
}
