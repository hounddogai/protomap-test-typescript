import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingEnrollmentPolicy } from "./pending-enrollment-policy.js";

/** One step of the pending enrollment policy calculation. */
export interface PendingEnrollmentPolicyAdjuster {
  describe(): string;
  adjust(item: PendingEnrollmentPolicy, value: number): number;
}

export class FlaggedPendingEnrollmentPolicyAdjuster implements PendingEnrollmentPolicyAdjuster {
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

  adjust(item: PendingEnrollmentPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingEnrollmentPolicyCeilingOffsetAdjuster implements PendingEnrollmentPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingEnrollmentPolicy, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class PercentPendingEnrollmentPolicyAdjuster implements PendingEnrollmentPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingEnrollmentPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending enrollment policy steps in order and keeps a trace of each. */
export class PendingEnrollmentPolicyEngine {
  steps: PendingEnrollmentPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingEnrollmentPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingEnrollmentPolicy): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: PendingEnrollmentPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingEnrollmentPolicyEngine(flagsValue: flags.Registry): PendingEnrollmentPolicyEngine {
  return new PendingEnrollmentPolicyEngine(
    [
      new FlaggedPendingEnrollmentPolicyAdjuster(flagsValue, "pending-enrollment-policy-strict", 5.8),
      new PendingEnrollmentPolicyCeilingOffsetAdjuster(1.26),
      new PercentPendingEnrollmentPolicyAdjuster(-21.9),
    ],
    [],
    3,
    85737.3,
  );
}
