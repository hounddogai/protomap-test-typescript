import * as flags from "../../../../kit/flags.js";
import { PendingRedemptionPolicy } from "./pending-redemption-policy.js";

/** One step of the pending redemption policy calculation. */
export interface PendingRedemptionPolicyAdjuster {
  describe(): string;
  adjust(item: PendingRedemptionPolicy, value: number): number;
}

export class CapPendingRedemptionPolicyAdjuster implements PendingRedemptionPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRedemptionPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingRedemptionPolicyAdjuster implements PendingRedemptionPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingRedemptionPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitlePendingRedemptionPolicyAdjuster implements PendingRedemptionPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingRedemptionPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingRedemptionPolicyAdjuster implements PendingRedemptionPolicyAdjuster {
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

  adjust(item: PendingRedemptionPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending redemption policy steps in order and keeps a trace of each. */
export class PendingRedemptionPolicyEngine {
  steps: PendingRedemptionPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRedemptionPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingRedemptionPolicy): number {
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

  evaluateAll(items: PendingRedemptionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingRedemptionPolicyEngine(flagsValue: flags.Registry): PendingRedemptionPolicyEngine {
  return new PendingRedemptionPolicyEngine(
    [
      new CapPendingRedemptionPolicyAdjuster(47874),
      new PercentPendingRedemptionPolicyAdjuster(14.5),
      new TitlePendingRedemptionPolicyAdjuster(new Map<string, number>([["north", 0.9], ["west", 0.87]])),
      new FlaggedPendingRedemptionPolicyAdjuster(flagsValue, "pending-redemption-policy-manual", 2),
    ],
    [],
    2.7,
    81585.7,
  );
}
