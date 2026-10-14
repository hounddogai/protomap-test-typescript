import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalDomainClaim } from "./regional-domain-claim.js";

/** One step of the regional domain claim calculation. */
export interface RegionalDomainClaimFactor {
  describe(): string;
  adjust(item: RegionalDomainClaim, value: number): number;
}

export class MinimumRegionalDomainClaimAdjuster implements RegionalDomainClaimFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalDomainClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalDomainClaimAdjuster implements RegionalDomainClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalDomainClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalDomainClaimAdjuster implements RegionalDomainClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalDomainClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionalDomainClaimCeilingOffsetAdjuster implements RegionalDomainClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: RegionalDomainClaim, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class FlaggedRegionalDomainClaimAdjuster implements RegionalDomainClaimFactor {
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

  adjust(item: RegionalDomainClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameRegionalDomainClaimAdjuster implements RegionalDomainClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RegionalDomainClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional domain claim steps in order and keeps a trace of each. */
export class RegionalDomainClaimEngine {
  steps: RegionalDomainClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalDomainClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalDomainClaim): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RegionalDomainClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalDomainClaimEngine(flagsValue: flags.Registry): RegionalDomainClaimEngine {
  return new RegionalDomainClaimEngine(
    [
      new MinimumRegionalDomainClaimAdjuster(24.4),
      new TieredRegionalDomainClaimAdjuster([1592, 2883, 3986, 4507], [0.83, 1.03, 0.88, 1.13]),
      new RoundingRegionalDomainClaimAdjuster(0.5),
      new RegionalDomainClaimCeilingOffsetAdjuster(0.63),
      new FlaggedRegionalDomainClaimAdjuster(flagsValue, "regional-domain-claim-weighted", -5.8),
      new NameRegionalDomainClaimAdjuster(
        new Map<string, number>([["central", 1.15], ["east", 0.96], ["retail", 0.87]]),
      ),
    ],
    [],
    4.4,
    71873.7,
  );
}
