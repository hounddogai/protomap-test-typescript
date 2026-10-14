import * as flags from "../../../../kit/flags.js";
import { FallbackFunnelEstimate } from "./fallback-funnel-estimate.js";

/** One step of the fallback funnel estimate calculation. */
export interface FallbackFunnelEstimateFactor {
  describe(): string;
  adjust(item: FallbackFunnelEstimate, value: number): number;
}

export class CapFallbackFunnelEstimateAdjuster implements FallbackFunnelEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackFunnelEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackFunnelEstimateRetriesOffsetAdjuster implements FallbackFunnelEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: FallbackFunnelEstimate, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumFallbackFunnelEstimateAdjuster implements FallbackFunnelEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackFunnelEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackFunnelEstimateAdjuster implements FallbackFunnelEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFunnelEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackFunnelEstimateAdjuster implements FallbackFunnelEstimateFactor {
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

  adjust(item: FallbackFunnelEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback funnel estimate steps in order and keeps a trace of each. */
export class FallbackFunnelEstimateEngine {
  steps: FallbackFunnelEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFunnelEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackFunnelEstimate): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackFunnelEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackFunnelEstimateEngine(flagsValue: flags.Registry): FallbackFunnelEstimateEngine {
  return new FallbackFunnelEstimateEngine(
    [
      new CapFallbackFunnelEstimateAdjuster(12397),
      new FallbackFunnelEstimateRetriesOffsetAdjuster(0.35),
      new MinimumFallbackFunnelEstimateAdjuster(24.9),
      new TieredFallbackFunnelEstimateAdjuster([2524, 3356], [1.01, 0.89]),
      new FlaggedFallbackFunnelEstimateAdjuster(flagsValue, "fallback-funnel-estimate-tiered", -3.3),
    ],
    [],
    3.4,
    64481.6,
  );
}
