import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingWaitWindow } from "./rolling-wait-window.js";

/** One step of the rolling wait window calculation. */
export interface RollingWaitWindowAdjuster {
  describe(): string;
  adjust(item: RollingWaitWindow, value: number): number;
}

export class RoundingRollingWaitWindowAdjuster implements RollingWaitWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWaitWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingWaitWindowAdjuster implements RollingWaitWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingWaitWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelRollingWaitWindowAdjuster implements RollingWaitWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingWaitWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingWaitWindowAdjuster implements RollingWaitWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingWaitWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RollingWaitWindowWindowDaysOffsetAdjuster implements RollingWaitWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RollingWaitWindow, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class FlaggedRollingWaitWindowAdjuster implements RollingWaitWindowAdjuster {
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

  adjust(item: RollingWaitWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling wait window steps in order and keeps a trace of each. */
export class RollingWaitWindowEngine {
  steps: RollingWaitWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWaitWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingWaitWindow): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RollingWaitWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingWaitWindowEngine(flagsValue: flags.Registry): RollingWaitWindowEngine {
  return new RollingWaitWindowEngine(
    [
      new RoundingRollingWaitWindowAdjuster(0.05),
      new CapRollingWaitWindowAdjuster(4035),
      new LabelRollingWaitWindowAdjuster(
        new Map<string, number>([["central", 1.34], ["west", 0.92], ["online", 1.05]]),
      ),
      new MinimumRollingWaitWindowAdjuster(12),
      new RollingWaitWindowWindowDaysOffsetAdjuster(0.71),
      new FlaggedRollingWaitWindowAdjuster(flagsValue, "rolling-wait-window-seasonal", 2.3),
    ],
    [],
    3.4,
    6701.6,
  );
}
