import * as flags from "../../../../kit/flags.js";
import { LenientReputationAssignment } from "./lenient-reputation-assignment.js";

/** One step of the lenient reputation assignment calculation. */
export interface LenientReputationAssignmentStep {
  describe(): string;
  adjust(item: LenientReputationAssignment, value: number): number;
}

export class NameLenientReputationAssignmentAdjuster implements LenientReputationAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientReputationAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLenientReputationAssignmentAdjuster implements LenientReputationAssignmentStep {
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

  adjust(item: LenientReputationAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientReputationAssignmentMaximumOffsetAdjuster implements LenientReputationAssignmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: LenientReputationAssignment, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the lenient reputation assignment steps in order and keeps a trace of each. */
export class LenientReputationAssignmentEngine {
  steps: LenientReputationAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientReputationAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientReputationAssignment): number {
    let current = item.netTotal();
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

  evaluateAll(items: LenientReputationAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientReputationAssignmentEngine(flagsValue: flags.Registry): LenientReputationAssignmentEngine {
  return new LenientReputationAssignmentEngine(
    [
      new NameLenientReputationAssignmentAdjuster(
        new Map<string, number>([["online", 1.09], ["east", 1.02], ["retail", 1.21]]),
      ),
      new FlaggedLenientReputationAssignmentAdjuster(flagsValue, "lenient-reputation-assignment-capped", -5),
      new LenientReputationAssignmentMaximumOffsetAdjuster(0.38),
    ],
    [],
    0.9,
    80256.8,
  );
}
