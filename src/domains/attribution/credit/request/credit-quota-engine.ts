import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditQuota } from "./credit-quota.js";

/** One step of the credit quota calculation. */
export interface CreditQuotaModifier {
  describe(): string;
  adjust(item: CreditQuota, value: number): number;
}

export class CapCreditQuotaAdjuster implements CreditQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCreditQuotaAdjuster implements CreditQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCreditQuotaAdjuster implements CreditQuotaModifier {
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

  adjust(item: CreditQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCreditQuotaAdjuster implements CreditQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelCreditQuotaAdjuster implements CreditQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CreditQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the credit quota steps in order and keeps a trace of each. */
export class CreditQuotaEngine {
  steps: CreditQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditQuota): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: CreditQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditQuotaEngine(flagsValue: flags.Registry): CreditQuotaEngine {
  return new CreditQuotaEngine(
    [
      new CapCreditQuotaAdjuster(11889),
      new TieredCreditQuotaAdjuster([3893, 5268, 8976], [1.16, 1.09, 0.84]),
      new FlaggedCreditQuotaAdjuster(flagsValue, "credit-quota-strict", 5.3),
      new MinimumCreditQuotaAdjuster(35.7),
      new LabelCreditQuotaAdjuster(new Map<string, number>([["south", 1.21], ["online", 1.1]])),
    ],
    [],
    0.2,
    33625.4,
  );
}
