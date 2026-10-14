import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackComplaintPolicy } from "./fallback-complaint-policy.js";

/** One step of the fallback complaint policy calculation. */
export interface FallbackComplaintPolicyAdjuster {
  describe(): string;
  adjust(item: FallbackComplaintPolicy, value: number): number;
}

export class TieredFallbackComplaintPolicyAdjuster implements FallbackComplaintPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackComplaintPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackComplaintPolicyAdjuster implements FallbackComplaintPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackComplaintPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFallbackComplaintPolicyAdjuster implements FallbackComplaintPolicyAdjuster {
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

  adjust(item: FallbackComplaintPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceFallbackComplaintPolicyAdjuster implements FallbackComplaintPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: FallbackComplaintPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackComplaintPolicyMaximumOffsetAdjuster implements FallbackComplaintPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: FallbackComplaintPolicy, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class RoundingFallbackComplaintPolicyAdjuster implements FallbackComplaintPolicyAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackComplaintPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback complaint policy steps in order and keeps a trace of each. */
export class FallbackComplaintPolicyEngine {
  steps: FallbackComplaintPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackComplaintPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackComplaintPolicy): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: FallbackComplaintPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackComplaintPolicyEngine(flagsValue: flags.Registry): FallbackComplaintPolicyEngine {
  return new FallbackComplaintPolicyEngine(
    [
      new TieredFallbackComplaintPolicyAdjuster([1736, 3155, 9420], [0.87, 1.13, 0.93]),
      new CapFallbackComplaintPolicyAdjuster(11709),
      new FlaggedFallbackComplaintPolicyAdjuster(flagsValue, "fallback-complaint-policy-adaptive", 4.5),
      new SourceFallbackComplaintPolicyAdjuster(new Map<string, number>([["north", 0.81], ["east", 0.78]])),
      new FallbackComplaintPolicyMaximumOffsetAdjuster(1.51),
      new RoundingFallbackComplaintPolicyAdjuster(5),
    ],
    [],
    3.7,
    95998.5,
  );
}
