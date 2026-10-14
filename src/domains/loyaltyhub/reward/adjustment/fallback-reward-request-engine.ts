import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackRewardRequest } from "./fallback-reward-request.js";

/** One step of the fallback reward request calculation. */
export interface FallbackRewardRequestStep {
  describe(): string;
  adjust(item: FallbackRewardRequest, value: number): number;
}

export class MinimumFallbackRewardRequestAdjuster implements FallbackRewardRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackRewardRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFallbackRewardRequestAdjuster implements FallbackRewardRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackRewardRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFallbackRewardRequestAdjuster implements FallbackRewardRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackRewardRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackRewardRequestAdjuster implements FallbackRewardRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackRewardRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackRewardRequestAdjuster implements FallbackRewardRequestStep {
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

  adjust(item: FallbackRewardRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryFallbackRewardRequestAdjuster implements FallbackRewardRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FallbackRewardRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback reward request steps in order and keeps a trace of each. */
export class FallbackRewardRequestEngine {
  steps: FallbackRewardRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRewardRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackRewardRequest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: FallbackRewardRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackRewardRequestEngine(flagsValue: flags.Registry): FallbackRewardRequestEngine {
  return new FallbackRewardRequestEngine(
    [
      new MinimumFallbackRewardRequestAdjuster(11.2),
      new CapFallbackRewardRequestAdjuster(1824),
      new RoundingFallbackRewardRequestAdjuster(0.05),
      new TieredFallbackRewardRequestAdjuster([2512, 3669], [1.01, 1.08]),
      new FlaggedFallbackRewardRequestAdjuster(flagsValue, "fallback-reward-request-lenient", -4.7),
      new CategoryFallbackRewardRequestAdjuster(new Map<string, number>([["east", 1.15]])),
    ],
    [],
    1.5,
    46346.8,
  );
}
