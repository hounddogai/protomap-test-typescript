import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalDomainRollup } from "./regional-domain-rollup.js";

/** One step of the regional domain rollup calculation. */
export interface RegionalDomainRollupModifier {
  describe(): string;
  adjust(item: RegionalDomainRollup, value: number): number;
}

export class MinimumRegionalDomainRollupAdjuster implements RegionalDomainRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalDomainRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalDomainRollupAdjuster implements RegionalDomainRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalDomainRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalDomainRollupAdjuster implements RegionalDomainRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalDomainRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRegionalDomainRollupAdjuster implements RegionalDomainRollupModifier {
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

  adjust(item: RegionalDomainRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalDomainRollupWeightOffsetAdjuster implements RegionalDomainRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: RegionalDomainRollup, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class PercentRegionalDomainRollupAdjuster implements RegionalDomainRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalDomainRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional domain rollup steps in order and keeps a trace of each. */
export class RegionalDomainRollupEngine {
  steps: RegionalDomainRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalDomainRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalDomainRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RegionalDomainRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalDomainRollupEngine(flagsValue: flags.Registry): RegionalDomainRollupEngine {
  return new RegionalDomainRollupEngine(
    [
      new MinimumRegionalDomainRollupAdjuster(8.7),
      new CapRegionalDomainRollupAdjuster(37453),
      new TieredRegionalDomainRollupAdjuster([3969, 4015, 4950, 7854], [0.82, 0.99, 1.18, 0.88]),
      new FlaggedRegionalDomainRollupAdjuster(flagsValue, "regional-domain-rollup-adaptive", 3.5),
      new RegionalDomainRollupWeightOffsetAdjuster(1.53),
      new PercentRegionalDomainRollupAdjuster(17.9),
    ],
    [],
    4.6,
    43893.7,
  );
}
