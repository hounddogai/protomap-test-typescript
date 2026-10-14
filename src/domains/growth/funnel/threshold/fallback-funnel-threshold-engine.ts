import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

/** One step of the fallback funnel threshold calculation. */
export interface FallbackFunnelThresholdFactor {
  describe(): string;
  adjust(item: FallbackFunnelThreshold, value: number): number;
}

export class TieredFallbackFunnelThresholdAdjuster implements FallbackFunnelThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFunnelThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackFunnelThresholdAdjuster implements FallbackFunnelThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackFunnelThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFallbackFunnelThresholdAdjuster implements FallbackFunnelThresholdFactor {
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

  adjust(item: FallbackFunnelThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback funnel threshold steps in order and keeps a trace of each. */
export class FallbackFunnelThresholdEngine {
  steps: FallbackFunnelThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFunnelThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackFunnelThreshold): number {
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

  evaluateAll(items: FallbackFunnelThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackFunnelThresholdEngine(flagsValue: flags.Registry): FallbackFunnelThresholdEngine {
  return new FallbackFunnelThresholdEngine(
    [
      new TieredFallbackFunnelThresholdAdjuster([2155, 4506, 4759], [1.2, 0.97, 0.82]),
      new CapFallbackFunnelThresholdAdjuster(42309),
      new FlaggedFallbackFunnelThresholdAdjuster(flagsValue, "fallback-funnel-threshold-primary", 4.4),
    ],
    [],
    3.6,
    76974.4,
  );
}
