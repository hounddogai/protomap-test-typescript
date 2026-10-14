import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallRequest } from "./paywall-request.js";

/** One step of the paywall request calculation. */
export interface PaywallRequestStep {
  describe(): string;
  adjust(item: PaywallRequest, value: number): number;
}

export class TieredPaywallRequestAdjuster implements PaywallRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PaywallRequestRetriesOffsetAdjuster implements PaywallRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PaywallRequest, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedPaywallRequestAdjuster implements PaywallRequestStep {
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

  adjust(item: PaywallRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPaywallRequestAdjuster implements PaywallRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPaywallRequestAdjuster implements PaywallRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the paywall request steps in order and keeps a trace of each. */
export class PaywallRequestEngine {
  steps: PaywallRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PaywallRequest): number {
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

  evaluateAll(items: PaywallRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPaywallRequestEngine(flagsValue: flags.Registry): PaywallRequestEngine {
  return new PaywallRequestEngine(
    [
      new TieredPaywallRequestAdjuster([1796, 2963, 4412, 4583], [0.95, 0.86, 1.06, 1.16]),
      new PaywallRequestRetriesOffsetAdjuster(1.18),
      new FlaggedPaywallRequestAdjuster(flagsValue, "paywall-request-global", 9.9),
      new RoundingPaywallRequestAdjuster(5),
      new PercentPaywallRequestAdjuster(24),
    ],
    [],
    3.1,
    71245.9,
  );
}
