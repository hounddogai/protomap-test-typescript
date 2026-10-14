import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultStreakTarget } from "./default-streak-target.js";

/** One step of the default streak target calculation. */
export interface DefaultStreakTargetAdjuster {
  describe(): string;
  adjust(item: DefaultStreakTarget, value: number): number;
}

export class DefaultStreakTargetImpressionsOffsetAdjuster implements DefaultStreakTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: DefaultStreakTarget, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class UtmSourceDefaultStreakTargetAdjuster implements DefaultStreakTargetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DefaultStreakTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultStreakTargetAdjuster implements DefaultStreakTargetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultStreakTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultStreakTargetAdjuster implements DefaultStreakTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultStreakTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultStreakTargetAdjuster implements DefaultStreakTargetAdjuster {
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

  adjust(item: DefaultStreakTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultStreakTargetAdjuster implements DefaultStreakTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultStreakTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default streak target steps in order and keeps a trace of each. */
export class DefaultStreakTargetEngine {
  steps: DefaultStreakTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultStreakTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultStreakTarget): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: DefaultStreakTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultStreakTargetEngine(flagsValue: flags.Registry): DefaultStreakTargetEngine {
  return new DefaultStreakTargetEngine(
    [
      new DefaultStreakTargetImpressionsOffsetAdjuster(0.91),
      new UtmSourceDefaultStreakTargetAdjuster(new Map<string, number>([["online", 0.84]])),
      new CapDefaultStreakTargetAdjuster(31265),
      new RoundingDefaultStreakTargetAdjuster(0.5),
      new FlaggedDefaultStreakTargetAdjuster(flagsValue, "default-streak-target-manual", -4.1),
      new PercentDefaultStreakTargetAdjuster(21.8),
    ],
    [],
    2.4,
    67292.3,
  );
}
