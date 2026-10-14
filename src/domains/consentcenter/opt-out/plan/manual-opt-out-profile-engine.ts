import * as flags from "../../../../kit/flags.js";
import { ManualOptOutProfile } from "./manual-opt-out-profile.js";

/** One step of the manual opt out profile calculation. */
export interface ManualOptOutProfileModifier {
  describe(): string;
  adjust(item: ManualOptOutProfile, value: number): number;
}

export class CapManualOptOutProfileAdjuster implements ManualOptOutProfileModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualOptOutProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ManualOptOutProfileGraceDaysOffsetAdjuster implements ManualOptOutProfileModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ManualOptOutProfile, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class FlaggedManualOptOutProfileAdjuster implements ManualOptOutProfileModifier {
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

  adjust(item: ManualOptOutProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualOptOutProfileAdjuster implements ManualOptOutProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualOptOutProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual opt out profile steps in order and keeps a trace of each. */
export class ManualOptOutProfileEngine {
  steps: ManualOptOutProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualOptOutProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualOptOutProfile): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ManualOptOutProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualOptOutProfileEngine(flagsValue: flags.Registry): ManualOptOutProfileEngine {
  return new ManualOptOutProfileEngine(
    [
      new CapManualOptOutProfileAdjuster(39598),
      new ManualOptOutProfileGraceDaysOffsetAdjuster(1.75),
      new FlaggedManualOptOutProfileAdjuster(flagsValue, "manual-opt-out-profile-manual", -8.8),
      new MinimumManualOptOutProfileAdjuster(42.9),
    ],
    [],
    2,
    38055.9,
  );
}
