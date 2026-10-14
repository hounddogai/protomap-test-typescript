import * as flags from "../../../../kit/flags.js";
import { RegionalPathPolicy } from "./regional-path-policy.js";

/** One step of the regional path policy calculation. */
export interface RegionalPathPolicyModifier {
  describe(): string;
  adjust(item: RegionalPathPolicy, value: number): number;
}

export class MinimumRegionalPathPolicyAdjuster implements RegionalPathPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalPathPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalPathPolicyAdjuster implements RegionalPathPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPathPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelRegionalPathPolicyAdjuster implements RegionalPathPolicyModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalPathPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRegionalPathPolicyAdjuster implements RegionalPathPolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPathPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalPathPolicyAdjuster implements RegionalPathPolicyModifier {
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

  adjust(item: RegionalPathPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalPathPolicyAdjuster implements RegionalPathPolicyModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPathPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional path policy steps in order and keeps a trace of each. */
export class RegionalPathPolicyEngine {
  steps: RegionalPathPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPathPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPathPolicy): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RegionalPathPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPathPolicyEngine(flagsValue: flags.Registry): RegionalPathPolicyEngine {
  return new RegionalPathPolicyEngine(
    [
      new MinimumRegionalPathPolicyAdjuster(40.5),
      new TieredRegionalPathPolicyAdjuster([2650, 3129], [1, 1.17]),
      new LabelRegionalPathPolicyAdjuster(new Map<string, number>([["retail", 0.95]])),
      new PercentRegionalPathPolicyAdjuster(17.7),
      new FlaggedRegionalPathPolicyAdjuster(flagsValue, "regional-path-policy-tiered", -1.1),
      new CapRegionalPathPolicyAdjuster(28519),
    ],
    [],
    0.7,
    49260.2,
  );
}
