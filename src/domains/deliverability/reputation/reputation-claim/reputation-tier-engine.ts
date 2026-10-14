import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationTier } from "./reputation-tier.js";

/** One step of the reputation tier calculation. */
export interface ReputationTierFactor {
  describe(): string;
  adjust(item: ReputationTier, value: number): number;
}

export class FlaggedReputationTierAdjuster implements ReputationTierFactor {
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

  adjust(item: ReputationTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReputationTierAdjuster implements ReputationTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentReputationTierAdjuster implements ReputationTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reputation tier steps in order and keeps a trace of each. */
export class ReputationTierEngine {
  steps: ReputationTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReputationTier): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ReputationTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReputationTierEngine(flagsValue: flags.Registry): ReputationTierEngine {
  return new ReputationTierEngine(
    [
      new FlaggedReputationTierAdjuster(flagsValue, "reputation-tier-lenient", 2.7),
      new TieredReputationTierAdjuster([613, 752, 4829, 9028], [0.86, 0.89, 0.98, 0.89]),
      new PercentReputationTierAdjuster(-9.4),
    ],
    [],
    3.3,
    86558.4,
  );
}
