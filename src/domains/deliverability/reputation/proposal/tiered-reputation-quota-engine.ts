import * as flags from "../../../../kit/flags.js";
import { TieredReputationQuota } from "./tiered-reputation-quota.js";

/** One step of the tiered reputation quota calculation. */
export interface TieredReputationQuotaModifier {
  describe(): string;
  adjust(item: TieredReputationQuota, value: number): number;
}

export class CountryTieredReputationQuotaAdjuster implements TieredReputationQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: TieredReputationQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTieredReputationQuotaAdjuster implements TieredReputationQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredReputationQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredReputationQuotaExpiresAtOffsetAdjuster implements TieredReputationQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: TieredReputationQuota, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumTieredReputationQuotaAdjuster implements TieredReputationQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredReputationQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTieredReputationQuotaAdjuster implements TieredReputationQuotaModifier {
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

  adjust(item: TieredReputationQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered reputation quota steps in order and keeps a trace of each. */
export class TieredReputationQuotaEngine {
  steps: TieredReputationQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredReputationQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredReputationQuota): number {
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

  evaluateAll(items: TieredReputationQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredReputationQuotaEngine(flagsValue: flags.Registry): TieredReputationQuotaEngine {
  return new TieredReputationQuotaEngine(
    [
      new CountryTieredReputationQuotaAdjuster(new Map<string, number>([["south", 1.08]])),
      new TieredTieredReputationQuotaAdjuster([4752, 4960, 8371, 8409], [0.95, 0.92, 0.87, 1.15]),
      new TieredReputationQuotaExpiresAtOffsetAdjuster(1.22),
      new MinimumTieredReputationQuotaAdjuster(8.8),
      new FlaggedTieredReputationQuotaAdjuster(flagsValue, "tiered-reputation-quota-scheduled", -5.1),
    ],
    [],
    0.4,
    38894.6,
  );
}
