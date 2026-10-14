import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallVariance } from "./paywall-variance.js";

/** One step of the paywall variance calculation. */
export interface PaywallVarianceAdjuster {
  describe(): string;
  adjust(item: PaywallVariance, value: number): number;
}

export class PaywallVarianceBatchSizeOffsetAdjuster implements PaywallVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: PaywallVariance, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class PercentPaywallVarianceAdjuster implements PaywallVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPaywallVarianceAdjuster implements PaywallVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPaywallVarianceAdjuster implements PaywallVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPaywallVarianceAdjuster implements PaywallVarianceAdjuster {
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

  adjust(item: PaywallVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the paywall variance steps in order and keeps a trace of each. */
export class PaywallVarianceEngine {
  steps: PaywallVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PaywallVariance): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PaywallVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPaywallVarianceEngine(flagsValue: flags.Registry): PaywallVarianceEngine {
  return new PaywallVarianceEngine(
    [
      new PaywallVarianceBatchSizeOffsetAdjuster(1.91),
      new PercentPaywallVarianceAdjuster(-17.9),
      new CapPaywallVarianceAdjuster(7837),
      new TieredPaywallVarianceAdjuster([317, 3104, 7231], [1.11, 0.92, 1.05]),
      new FlaggedPaywallVarianceAdjuster(flagsValue, "paywall-variance-seasonal", -1.1),
    ],
    [],
    4.6,
    21501.1,
  );
}
