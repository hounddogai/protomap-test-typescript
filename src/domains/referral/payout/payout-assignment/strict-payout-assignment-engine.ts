import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictPayoutAssignment } from "./strict-payout-assignment.js";

/** One step of the strict payout assignment calculation. */
export interface StrictPayoutAssignmentFactor {
  describe(): string;
  adjust(item: StrictPayoutAssignment, value: number): number;
}

export class RoundingStrictPayoutAssignmentAdjuster implements StrictPayoutAssignmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPayoutAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictPayoutAssignmentWindowDaysOffsetAdjuster implements StrictPayoutAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: StrictPayoutAssignment, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class FlaggedStrictPayoutAssignmentAdjuster implements StrictPayoutAssignmentFactor {
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

  adjust(item: StrictPayoutAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStrictPayoutAssignmentAdjuster implements StrictPayoutAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictPayoutAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictPayoutAssignmentAdjuster implements StrictPayoutAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPayoutAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict payout assignment steps in order and keeps a trace of each. */
export class StrictPayoutAssignmentEngine {
  steps: StrictPayoutAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPayoutAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictPayoutAssignment): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: StrictPayoutAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictPayoutAssignmentEngine(flagsValue: flags.Registry): StrictPayoutAssignmentEngine {
  return new StrictPayoutAssignmentEngine(
    [
      new RoundingStrictPayoutAssignmentAdjuster(0.1),
      new StrictPayoutAssignmentWindowDaysOffsetAdjuster(1.12),
      new FlaggedStrictPayoutAssignmentAdjuster(flagsValue, "strict-payout-assignment-manual", 9.4),
      new PercentStrictPayoutAssignmentAdjuster(23.3),
      new CapStrictPayoutAssignmentAdjuster(11435),
    ],
    [],
    4.8,
    33496.2,
  );
}
