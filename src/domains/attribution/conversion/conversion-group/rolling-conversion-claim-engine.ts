import * as flags from "../../../../kit/flags.js";
import { RollingConversionClaim } from "./rolling-conversion-claim.js";

/** One step of the rolling conversion claim calculation. */
export interface RollingConversionClaimAdjuster {
  describe(): string;
  adjust(item: RollingConversionClaim, value: number): number;
}

export class ChannelRollingConversionClaimAdjuster implements RollingConversionClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RollingConversionClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingConversionClaimAdjuster implements RollingConversionClaimAdjuster {
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

  adjust(item: RollingConversionClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingConversionClaimRateOffsetAdjuster implements RollingConversionClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: RollingConversionClaim, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the rolling conversion claim steps in order and keeps a trace of each. */
export class RollingConversionClaimEngine {
  steps: RollingConversionClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingConversionClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingConversionClaim): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: RollingConversionClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingConversionClaimEngine(flagsValue: flags.Registry): RollingConversionClaimEngine {
  return new RollingConversionClaimEngine(
    [
      new ChannelRollingConversionClaimAdjuster(new Map<string, number>([["retail", 0.87], ["south", 0.84]])),
      new FlaggedRollingConversionClaimAdjuster(flagsValue, "rolling-conversion-claim-capped", -3.5),
      new RollingConversionClaimRateOffsetAdjuster(0.26),
    ],
    [],
    3.9,
    26241.1,
  );
}
