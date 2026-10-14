import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

/** One step of the adaptive funnel estimate calculation. */
export interface AdaptiveFunnelEstimateFactor {
  describe(): string;
  adjust(item: AdaptiveFunnelEstimate, value: number): number;
}

export class MinimumAdaptiveFunnelEstimateAdjuster implements AdaptiveFunnelEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveFunnelEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveFunnelEstimateAdjuster implements AdaptiveFunnelEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveFunnelEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedAdaptiveFunnelEstimateAdjuster implements AdaptiveFunnelEstimateFactor {
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

  adjust(item: AdaptiveFunnelEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveFunnelEstimateAdjuster implements AdaptiveFunnelEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveFunnelEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive funnel estimate steps in order and keeps a trace of each. */
export class AdaptiveFunnelEstimateEngine {
  steps: AdaptiveFunnelEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFunnelEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveFunnelEstimate): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: AdaptiveFunnelEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveFunnelEstimateEngine(flagsValue: flags.Registry): AdaptiveFunnelEstimateEngine {
  return new AdaptiveFunnelEstimateEngine(
    [
      new MinimumAdaptiveFunnelEstimateAdjuster(48.5),
      new CapAdaptiveFunnelEstimateAdjuster(1349),
      new FlaggedAdaptiveFunnelEstimateAdjuster(flagsValue, "adaptive-funnel-estimate-strict", 9.6),
      new PercentAdaptiveFunnelEstimateAdjuster(2),
    ],
    [],
    2,
    84543.3,
  );
}
