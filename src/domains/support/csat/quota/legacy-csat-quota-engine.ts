import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyCsatQuota } from "./legacy-csat-quota.js";

/** One step of the legacy csat quota calculation. */
export interface LegacyCsatQuotaModifier {
  describe(): string;
  adjust(item: LegacyCsatQuota, value: number): number;
}

export class TieredLegacyCsatQuotaAdjuster implements LegacyCsatQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyCsatQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLegacyCsatQuotaAdjuster implements LegacyCsatQuotaModifier {
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

  adjust(item: LegacyCsatQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyCsatQuotaAdjuster implements LegacyCsatQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyCsatQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelLegacyCsatQuotaAdjuster implements LegacyCsatQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyCsatQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy csat quota steps in order and keeps a trace of each. */
export class LegacyCsatQuotaEngine {
  steps: LegacyCsatQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyCsatQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyCsatQuota): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: LegacyCsatQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyCsatQuotaEngine(flagsValue: flags.Registry): LegacyCsatQuotaEngine {
  return new LegacyCsatQuotaEngine(
    [
      new TieredLegacyCsatQuotaAdjuster([1516, 1832, 5333], [1.01, 1.01, 1.04]),
      new FlaggedLegacyCsatQuotaAdjuster(flagsValue, "legacy-csat-quota-seasonal", -5.1),
      new MinimumLegacyCsatQuotaAdjuster(29),
      new LabelLegacyCsatQuotaAdjuster(new Map<string, number>([["central", 1.11]])),
    ],
    [],
    4.7,
    52232.7,
  );
}
