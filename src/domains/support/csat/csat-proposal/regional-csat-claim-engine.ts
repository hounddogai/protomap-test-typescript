import * as flags from "../../../../kit/flags.js";
import { RegionalCsatClaim } from "./regional-csat-claim.js";

/** One step of the regional csat claim calculation. */
export interface RegionalCsatClaimStep {
  describe(): string;
  adjust(item: RegionalCsatClaim, value: number): number;
}

export class MinimumRegionalCsatClaimAdjuster implements RegionalCsatClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalCsatClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalCsatClaimAdjuster implements RegionalCsatClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalCsatClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRegionalCsatClaimAdjuster implements RegionalCsatClaimStep {
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

  adjust(item: RegionalCsatClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalCsatClaimAdjuster implements RegionalCsatClaimStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalCsatClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional csat claim steps in order and keeps a trace of each. */
export class RegionalCsatClaimEngine {
  steps: RegionalCsatClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCsatClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalCsatClaim): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RegionalCsatClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalCsatClaimEngine(flagsValue: flags.Registry): RegionalCsatClaimEngine {
  return new RegionalCsatClaimEngine(
    [
      new MinimumRegionalCsatClaimAdjuster(15.4),
      new CapRegionalCsatClaimAdjuster(11004),
      new FlaggedRegionalCsatClaimAdjuster(flagsValue, "regional-csat-claim-lenient", 0.8),
      new PercentRegionalCsatClaimAdjuster(-15.3),
    ],
    [],
    4.3,
    53635.8,
  );
}
