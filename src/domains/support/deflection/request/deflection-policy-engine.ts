import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionPolicy } from "./deflection-policy.js";

/** One step of the deflection policy calculation. */
export interface DeflectionPolicyAdjuster {
  describe(): string;
  adjust(item: DeflectionPolicy, value: number): number;
}

export class PercentDeflectionPolicyAdjuster implements DeflectionPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDeflectionPolicyAdjuster implements DeflectionPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDeflectionPolicyAdjuster implements DeflectionPolicyAdjuster {
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

  adjust(item: DeflectionPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameDeflectionPolicyAdjuster implements DeflectionPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DeflectionPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the deflection policy steps in order and keeps a trace of each. */
export class DeflectionPolicyEngine {
  steps: DeflectionPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DeflectionPolicy): number {
    let current = item.netLoad();
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

  evaluateAll(items: DeflectionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDeflectionPolicyEngine(flagsValue: flags.Registry): DeflectionPolicyEngine {
  return new DeflectionPolicyEngine(
    [
      new PercentDeflectionPolicyAdjuster(12.6),
      new TieredDeflectionPolicyAdjuster([1175, 4645, 5070, 6860], [1.07, 1.1, 1.17, 1.03]),
      new FlaggedDeflectionPolicyAdjuster(flagsValue, "deflection-policy-adaptive", 4.1),
      new NameDeflectionPolicyAdjuster(new Map<string, number>([["east", 0.71]])),
    ],
    [],
    4.2,
    30799.7,
  );
}
