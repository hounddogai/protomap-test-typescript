import * as flags from "../../../../kit/flags.js";
import { SuppressionAssignment } from "./suppression-assignment.js";

/** One step of the suppression assignment calculation. */
export interface SuppressionAssignmentFactor {
  describe(): string;
  adjust(item: SuppressionAssignment, value: number): number;
}

export class FlaggedSuppressionAssignmentAdjuster implements SuppressionAssignmentFactor {
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

  adjust(item: SuppressionAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSuppressionAssignmentAdjuster implements SuppressionAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SuppressionAssignmentWeightOffsetAdjuster implements SuppressionAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: SuppressionAssignment, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the suppression assignment steps in order and keeps a trace of each. */
export class SuppressionAssignmentEngine {
  steps: SuppressionAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SuppressionAssignment): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: SuppressionAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSuppressionAssignmentEngine(flagsValue: flags.Registry): SuppressionAssignmentEngine {
  return new SuppressionAssignmentEngine(
    [
      new FlaggedSuppressionAssignmentAdjuster(flagsValue, "suppression-assignment-adaptive", 1.3),
      new PercentSuppressionAssignmentAdjuster(-1.5),
      new SuppressionAssignmentWeightOffsetAdjuster(0.53),
    ],
    [],
    3.8,
    60552.2,
  );
}
