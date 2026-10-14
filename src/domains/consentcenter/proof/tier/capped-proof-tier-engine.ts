import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedProofTier } from "./capped-proof-tier.js";

/** One step of the capped proof tier calculation. */
export interface CappedProofTierFactor {
  describe(): string;
  adjust(item: CappedProofTier, value: number): number;
}

export class TieredCappedProofTierAdjuster implements CappedProofTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedProofTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CappedProofTierBudgetOffsetAdjuster implements CappedProofTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CappedProofTier, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedCappedProofTierAdjuster implements CappedProofTierFactor {
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

  adjust(item: CappedProofTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedProofTierAdjuster implements CappedProofTierFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedProofTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCappedProofTierAdjuster implements CappedProofTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedProofTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped proof tier steps in order and keeps a trace of each. */
export class CappedProofTierEngine {
  steps: CappedProofTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedProofTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedProofTier): number {
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

  evaluateAll(items: CappedProofTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedProofTierEngine(flagsValue: flags.Registry): CappedProofTierEngine {
  return new CappedProofTierEngine(
    [
      new TieredCappedProofTierAdjuster([3568, 4732], [1.04, 1.08]),
      new CappedProofTierBudgetOffsetAdjuster(1.47),
      new FlaggedCappedProofTierAdjuster(flagsValue, "capped-proof-tier-manual", -8.8),
      new RoundingCappedProofTierAdjuster(1),
      new CapCappedProofTierAdjuster(11586),
    ],
    [],
    3.3,
    99498.2,
  );
}
