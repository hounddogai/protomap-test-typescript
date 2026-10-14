import * as flags from "../../../../kit/flags.js";
import { RollingStreakClaim } from "./rolling-streak-claim.js";

/** One step of the rolling streak claim calculation. */
export interface RollingStreakClaimStep {
  describe(): string;
  adjust(item: RollingStreakClaim, value: number): number;
}

export class FlaggedRollingStreakClaimAdjuster implements RollingStreakClaimStep {
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

  adjust(item: RollingStreakClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingStreakClaimCeilingOffsetAdjuster implements RollingStreakClaimStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: RollingStreakClaim, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class LocaleRollingStreakClaimAdjuster implements RollingStreakClaimStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingStreakClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRollingStreakClaimAdjuster implements RollingStreakClaimStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingStreakClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingStreakClaimAdjuster implements RollingStreakClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingStreakClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingStreakClaimAdjuster implements RollingStreakClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingStreakClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling streak claim steps in order and keeps a trace of each. */
export class RollingStreakClaimEngine {
  steps: RollingStreakClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingStreakClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingStreakClaim): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RollingStreakClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingStreakClaimEngine(flagsValue: flags.Registry): RollingStreakClaimEngine {
  return new RollingStreakClaimEngine(
    [
      new FlaggedRollingStreakClaimAdjuster(flagsValue, "rolling-streak-claim-seasonal", 3.3),
      new RollingStreakClaimCeilingOffsetAdjuster(1.96),
      new LocaleRollingStreakClaimAdjuster(new Map<string, number>([["south", 0.88], ["east", 1.05]])),
      new PercentRollingStreakClaimAdjuster(23.3),
      new CapRollingStreakClaimAdjuster(34641),
      new TieredRollingStreakClaimAdjuster([1219, 1604, 1787, 8676], [1.06, 0.87, 1.15, 0.94]),
    ],
    [],
    4.4,
    91682.5,
  );
}
