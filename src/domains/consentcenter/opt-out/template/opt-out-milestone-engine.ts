import * as flags from "../../../../kit/flags.js";
import { OptOutMilestone } from "./opt-out-milestone.js";

/** One step of the opt out milestone calculation. */
export interface OptOutMilestoneModifier {
  describe(): string;
  adjust(item: OptOutMilestone, value: number): number;
}

export class FlaggedOptOutMilestoneAdjuster implements OptOutMilestoneModifier {
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

  adjust(item: OptOutMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumOptOutMilestoneAdjuster implements OptOutMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapOptOutMilestoneAdjuster implements OptOutMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the opt out milestone steps in order and keeps a trace of each. */
export class OptOutMilestoneEngine {
  steps: OptOutMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: OptOutMilestone): number {
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

  evaluateAll(items: OptOutMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultOptOutMilestoneEngine(flagsValue: flags.Registry): OptOutMilestoneEngine {
  return new OptOutMilestoneEngine(
    [
      new FlaggedOptOutMilestoneAdjuster(flagsValue, "opt-out-milestone-legacy", 1.9),
      new MinimumOptOutMilestoneAdjuster(48.8),
      new CapOptOutMilestoneAdjuster(43400),
    ],
    [],
    2.9,
    16760.3,
  );
}
