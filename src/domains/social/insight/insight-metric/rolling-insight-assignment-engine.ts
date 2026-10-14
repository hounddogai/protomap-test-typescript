import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingInsightAssignment } from "./rolling-insight-assignment.js";

/** One step of the rolling insight assignment calculation. */
export interface RollingInsightAssignmentFactor {
  describe(): string;
  adjust(item: RollingInsightAssignment, value: number): number;
}

export class FlaggedRollingInsightAssignmentAdjuster implements RollingInsightAssignmentFactor {
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

  adjust(item: RollingInsightAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingInsightAssignmentAdjuster implements RollingInsightAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingInsightAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingInsightAssignmentAdjuster implements RollingInsightAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingInsightAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling insight assignment steps in order and keeps a trace of each. */
export class RollingInsightAssignmentEngine {
  steps: RollingInsightAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingInsightAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingInsightAssignment): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RollingInsightAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingInsightAssignmentEngine(flagsValue: flags.Registry): RollingInsightAssignmentEngine {
  return new RollingInsightAssignmentEngine(
    [
      new FlaggedRollingInsightAssignmentAdjuster(flagsValue, "rolling-insight-assignment-global", -9.6),
      new PercentRollingInsightAssignmentAdjuster(-11.2),
      new MinimumRollingInsightAssignmentAdjuster(49.1),
    ],
    [],
    0.7,
    92035.3,
  );
}
