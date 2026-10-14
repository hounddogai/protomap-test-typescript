import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeAssignment } from "./challenge-assignment.js";

/** One step of the challenge assignment calculation. */
export interface ChallengeAssignmentStep {
  describe(): string;
  adjust(item: ChallengeAssignment, value: number): number;
}

export class RoundingChallengeAssignmentAdjuster implements ChallengeAssignmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapChallengeAssignmentAdjuster implements ChallengeAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelChallengeAssignmentAdjuster implements ChallengeAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ChallengeAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedChallengeAssignmentAdjuster implements ChallengeAssignmentStep {
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

  adjust(item: ChallengeAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChallengeAssignmentVersionOffsetAdjuster implements ChallengeAssignmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ChallengeAssignment, value: number): number {
    return value + item.version * this.weight;
  }
}

export class PercentChallengeAssignmentAdjuster implements ChallengeAssignmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the challenge assignment steps in order and keeps a trace of each. */
export class ChallengeAssignmentEngine {
  steps: ChallengeAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ChallengeAssignment): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ChallengeAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultChallengeAssignmentEngine(flagsValue: flags.Registry): ChallengeAssignmentEngine {
  return new ChallengeAssignmentEngine(
    [
      new RoundingChallengeAssignmentAdjuster(5),
      new CapChallengeAssignmentAdjuster(42201),
      new ChannelChallengeAssignmentAdjuster(new Map<string, number>([["east", 0.84], ["retail", 0.9]])),
      new FlaggedChallengeAssignmentAdjuster(flagsValue, "challenge-assignment-batched", -0.4),
      new ChallengeAssignmentVersionOffsetAdjuster(0.26),
      new PercentChallengeAssignmentAdjuster(23.1),
    ],
    [],
    2.9,
    56620.1,
  );
}
