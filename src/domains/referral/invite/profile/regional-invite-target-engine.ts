import * as flags from "../../../../kit/flags.js";
import { RegionalInviteTarget } from "./regional-invite-target.js";

/** One step of the regional invite target calculation. */
export interface RegionalInviteTargetFactor {
  describe(): string;
  adjust(item: RegionalInviteTarget, value: number): number;
}

export class FlaggedRegionalInviteTargetAdjuster implements RegionalInviteTargetFactor {
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

  adjust(item: RegionalInviteTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalInviteTargetAdjuster implements RegionalInviteTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalInviteTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalInviteTargetAdjuster implements RegionalInviteTargetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalInviteTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelRegionalInviteTargetAdjuster implements RegionalInviteTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalInviteTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional invite target steps in order and keeps a trace of each. */
export class RegionalInviteTargetEngine {
  steps: RegionalInviteTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalInviteTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalInviteTarget): number {
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

  evaluateAll(items: RegionalInviteTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalInviteTargetEngine(flagsValue: flags.Registry): RegionalInviteTargetEngine {
  return new RegionalInviteTargetEngine(
    [
      new FlaggedRegionalInviteTargetAdjuster(flagsValue, "regional-invite-target-manual", -7.3),
      new PercentRegionalInviteTargetAdjuster(-4.3),
      new TieredRegionalInviteTargetAdjuster([1271, 1682, 2272, 9296], [1.11, 0.8, 1.16, 0.96]),
      new LabelRegionalInviteTargetAdjuster(
        new Map<string, number>([["south", 1.26], ["central", 1.22], ["north", 0.77]]),
      ),
    ],
    [],
    0.8,
    13865.3,
  );
}
