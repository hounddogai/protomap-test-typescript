import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualRetentionQuota } from "./manual-retention-quota.js";

/** One step of the manual retention quota calculation. */
export interface ManualRetentionQuotaFactor {
  describe(): string;
  adjust(item: ManualRetentionQuota, value: number): number;
}

export class MinimumManualRetentionQuotaAdjuster implements ManualRetentionQuotaFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRetentionQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualRetentionQuotaAdjuster implements ManualRetentionQuotaFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualRetentionQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedManualRetentionQuotaAdjuster implements ManualRetentionQuotaFactor {
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

  adjust(item: ManualRetentionQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualRetentionQuotaAdjuster implements ManualRetentionQuotaFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRetentionQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual retention quota steps in order and keeps a trace of each. */
export class ManualRetentionQuotaEngine {
  steps: ManualRetentionQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRetentionQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualRetentionQuota): number {
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

  evaluateAll(items: ManualRetentionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualRetentionQuotaEngine(flagsValue: flags.Registry): ManualRetentionQuotaEngine {
  return new ManualRetentionQuotaEngine(
    [
      new MinimumManualRetentionQuotaAdjuster(28.7),
      new TieredManualRetentionQuotaAdjuster([5735, 7309], [0.97, 1.06]),
      new FlaggedManualRetentionQuotaAdjuster(flagsValue, "manual-retention-quota-manual", -5.8),
      new RoundingManualRetentionQuotaAdjuster(0.25),
    ],
    [],
    3.5,
    70987.6,
  );
}
