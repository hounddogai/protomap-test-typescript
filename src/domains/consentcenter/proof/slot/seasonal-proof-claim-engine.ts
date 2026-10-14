import * as flags from "../../../../kit/flags.js";
import { SeasonalProofClaim } from "./seasonal-proof-claim.js";

/** One step of the seasonal proof claim calculation. */
export interface SeasonalProofClaimAdjuster {
  describe(): string;
  adjust(item: SeasonalProofClaim, value: number): number;
}

export class MinimumSeasonalProofClaimAdjuster implements SeasonalProofClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalProofClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSeasonalProofClaimAdjuster implements SeasonalProofClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalProofClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalProofClaimCreatedAtOffsetAdjuster implements SeasonalProofClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: SeasonalProofClaim, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class FlaggedSeasonalProofClaimAdjuster implements SeasonalProofClaimAdjuster {
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

  adjust(item: SeasonalProofClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleSeasonalProofClaimAdjuster implements SeasonalProofClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SeasonalProofClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalProofClaimAdjuster implements SeasonalProofClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalProofClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal proof claim steps in order and keeps a trace of each. */
export class SeasonalProofClaimEngine {
  steps: SeasonalProofClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalProofClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalProofClaim): number {
    let current = item.netValue();
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

  evaluateAll(items: SeasonalProofClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalProofClaimEngine(flagsValue: flags.Registry): SeasonalProofClaimEngine {
  return new SeasonalProofClaimEngine(
    [
      new MinimumSeasonalProofClaimAdjuster(31.3),
      new PercentSeasonalProofClaimAdjuster(14.7),
      new SeasonalProofClaimCreatedAtOffsetAdjuster(1.81),
      new FlaggedSeasonalProofClaimAdjuster(flagsValue, "seasonal-proof-claim-strict", 2.2),
      new TitleSeasonalProofClaimAdjuster(new Map<string, number>([["south", 1.08], ["east", 0.71]])),
      new TieredSeasonalProofClaimAdjuster([623, 2499, 7437, 9063], [1.08, 0.81, 1.11, 0.82]),
    ],
    [],
    1.5,
    1054.9,
  );
}
