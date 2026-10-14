import * as flags from "../../../../kit/flags.js";
import { TierPolicy } from "./tier-policy.js";

/** One step of the tier policy calculation. */
export interface TierPolicyModifier {
  describe(): string;
  adjust(item: TierPolicy, value: number): number;
}

export class MinimumTierPolicyAdjuster implements TierPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTierPolicyAdjuster implements TierPolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTierPolicyAdjuster implements TierPolicyModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTierPolicyAdjuster implements TierPolicyModifier {
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

  adjust(item: TierPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tier policy steps in order and keeps a trace of each. */
export class TierPolicyEngine {
  steps: TierPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierPolicy): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TierPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierPolicyEngine(flagsValue: flags.Registry): TierPolicyEngine {
  return new TierPolicyEngine(
    [
      new MinimumTierPolicyAdjuster(20.7),
      new PercentTierPolicyAdjuster(16.4),
      new CapTierPolicyAdjuster(41093),
      new FlaggedTierPolicyAdjuster(flagsValue, "tier-policy-regional", 5.3),
    ],
    [],
    0.7,
    92645.2,
  );
}
