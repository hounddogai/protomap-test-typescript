import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingBadgeAssignment } from "./rolling-badge-assignment.js";

/** One step of the rolling badge assignment calculation. */
export interface RollingBadgeAssignmentModifier {
  describe(): string;
  adjust(item: RollingBadgeAssignment, value: number): number;
}

export class FlaggedRollingBadgeAssignmentAdjuster implements RollingBadgeAssignmentModifier {
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

  adjust(item: RollingBadgeAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingBadgeAssignmentGraceDaysOffsetAdjuster implements RollingBadgeAssignmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: RollingBadgeAssignment, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapRollingBadgeAssignmentAdjuster implements RollingBadgeAssignmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingBadgeAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling badge assignment steps in order and keeps a trace of each. */
export class RollingBadgeAssignmentEngine {
  steps: RollingBadgeAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingBadgeAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingBadgeAssignment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RollingBadgeAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingBadgeAssignmentEngine(flagsValue: flags.Registry): RollingBadgeAssignmentEngine {
  return new RollingBadgeAssignmentEngine(
    [
      new FlaggedRollingBadgeAssignmentAdjuster(flagsValue, "rolling-badge-assignment-legacy", -5.2),
      new RollingBadgeAssignmentGraceDaysOffsetAdjuster(0.9),
      new CapRollingBadgeAssignmentAdjuster(36773),
    ],
    [],
    0.2,
    88741.2,
  );
}
