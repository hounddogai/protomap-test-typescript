import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingApprovalDigest } from "./rolling-approval-digest.js";

/** One step of the rolling approval digest calculation. */
export interface RollingApprovalDigestFactor {
  describe(): string;
  adjust(item: RollingApprovalDigest, value: number): number;
}

export class PercentRollingApprovalDigestAdjuster implements RollingApprovalDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingApprovalDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelRollingApprovalDigestAdjuster implements RollingApprovalDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RollingApprovalDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingApprovalDigestAdjuster implements RollingApprovalDigestFactor {
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

  adjust(item: RollingApprovalDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingApprovalDigestAdjuster implements RollingApprovalDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingApprovalDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingApprovalDigestAdjuster implements RollingApprovalDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingApprovalDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRollingApprovalDigestAdjuster implements RollingApprovalDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingApprovalDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling approval digest steps in order and keeps a trace of each. */
export class RollingApprovalDigestEngine {
  steps: RollingApprovalDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingApprovalDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingApprovalDigest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RollingApprovalDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingApprovalDigestEngine(flagsValue: flags.Registry): RollingApprovalDigestEngine {
  return new RollingApprovalDigestEngine(
    [
      new PercentRollingApprovalDigestAdjuster(22.3),
      new ChannelRollingApprovalDigestAdjuster(new Map<string, number>([["east", 1.11], ["online", 0.79]])),
      new FlaggedRollingApprovalDigestAdjuster(flagsValue, "rolling-approval-digest-pending", -9.8),
      new TieredRollingApprovalDigestAdjuster([1119, 4349, 7901], [0.92, 1.05, 1]),
      new CapRollingApprovalDigestAdjuster(8233),
      new MinimumRollingApprovalDigestAdjuster(21.6),
    ],
    [],
    1,
    36042.8,
  );
}
