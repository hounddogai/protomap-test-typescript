import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelPolicy } from "./funnel-policy.js";

/** One step of the funnel policy calculation. */
export interface FunnelPolicyFactor {
  describe(): string;
  adjust(item: FunnelPolicy, value: number): number;
}

export class TieredFunnelPolicyAdjuster implements FunnelPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameFunnelPolicyAdjuster implements FunnelPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FunnelPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFunnelPolicyAdjuster implements FunnelPolicyFactor {
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

  adjust(item: FunnelPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFunnelPolicyAdjuster implements FunnelPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFunnelPolicyAdjuster implements FunnelPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the funnel policy steps in order and keeps a trace of each. */
export class FunnelPolicyEngine {
  steps: FunnelPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelPolicy): number {
    let current = item.netVolume();
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

  evaluateAll(items: FunnelPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelPolicyEngine(flagsValue: flags.Registry): FunnelPolicyEngine {
  return new FunnelPolicyEngine(
    [
      new TieredFunnelPolicyAdjuster([4638, 4956, 5363, 6669], [0.97, 1.04, 1.17, 0.81]),
      new NameFunnelPolicyAdjuster(new Map<string, number>([["north", 1.14]])),
      new FlaggedFunnelPolicyAdjuster(flagsValue, "funnel-policy-lenient", -5.8),
      new MinimumFunnelPolicyAdjuster(31.5),
      new CapFunnelPolicyAdjuster(32301),
    ],
    [],
    4.2,
    64789.3,
  );
}
