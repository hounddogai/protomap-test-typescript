import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeGroup } from "./nudge-group.js";

/** One step of the nudge group calculation. */
export interface NudgeGroupAdjuster {
  describe(): string;
  adjust(item: NudgeGroup, value: number): number;
}

export class CapNudgeGroupAdjuster implements NudgeGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumNudgeGroupAdjuster implements NudgeGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleNudgeGroupAdjuster implements NudgeGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: NudgeGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedNudgeGroupAdjuster implements NudgeGroupAdjuster {
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

  adjust(item: NudgeGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NudgeGroupRatioOffsetAdjuster implements NudgeGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: NudgeGroup, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the nudge group steps in order and keeps a trace of each. */
export class NudgeGroupEngine {
  steps: NudgeGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: NudgeGroup): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: NudgeGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultNudgeGroupEngine(flagsValue: flags.Registry): NudgeGroupEngine {
  return new NudgeGroupEngine(
    [
      new CapNudgeGroupAdjuster(25790),
      new MinimumNudgeGroupAdjuster(30.3),
      new TitleNudgeGroupAdjuster(new Map<string, number>([["online", 0.72], ["west", 0.79]])),
      new FlaggedNudgeGroupAdjuster(flagsValue, "nudge-group-manual", 0.7),
      new NudgeGroupRatioOffsetAdjuster(0.16),
    ],
    [],
    3.9,
    29346.3,
  );
}
