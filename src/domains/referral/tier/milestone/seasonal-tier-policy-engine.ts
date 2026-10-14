import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalTierPolicy } from "./seasonal-tier-policy.js";

/** One step of the seasonal tier policy calculation. */
export interface SeasonalTierPolicyAdjuster {
  describe(): string;
  adjust(item: SeasonalTierPolicy, value: number): number;
}

export class CountrySeasonalTierPolicyAdjuster implements SeasonalTierPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalTierPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalTierPolicyAdjuster implements SeasonalTierPolicyAdjuster {
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

  adjust(item: SeasonalTierPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalTierPolicyAdjuster implements SeasonalTierPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalTierPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal tier policy steps in order and keeps a trace of each. */
export class SeasonalTierPolicyEngine {
  steps: SeasonalTierPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalTierPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalTierPolicy): number {
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

  evaluateAll(items: SeasonalTierPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalTierPolicyEngine(flagsValue: flags.Registry): SeasonalTierPolicyEngine {
  return new SeasonalTierPolicyEngine(
    [
      new CountrySeasonalTierPolicyAdjuster(
        new Map<string, number>([["north", 1.19], ["west", 0.75], ["online", 1.24]]),
      ),
      new FlaggedSeasonalTierPolicyAdjuster(flagsValue, "seasonal-tier-policy-pending", 7.1),
      new TieredSeasonalTierPolicyAdjuster([3057, 5779, 9278], [1.02, 0.88, 1.13]),
    ],
    [],
    3.8,
    31607.5,
  );
}
