import * as flags from "../../../../kit/flags.js";
import { FunnelEstimate } from "./funnel-estimate.js";

/** One step of the funnel estimate calculation. */
export interface FunnelEstimateAdjuster {
  describe(): string;
  adjust(item: FunnelEstimate, value: number): number;
}

export class FunnelEstimateAttemptsOffsetAdjuster implements FunnelEstimateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: FunnelEstimate, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class FlaggedFunnelEstimateAdjuster implements FunnelEstimateAdjuster {
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

  adjust(item: FunnelEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFunnelEstimateAdjuster implements FunnelEstimateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFunnelEstimateAdjuster implements FunnelEstimateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentFunnelEstimateAdjuster implements FunnelEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel estimate steps in order and keeps a trace of each. */
export class FunnelEstimateEngine {
  steps: FunnelEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelEstimate): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: FunnelEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelEstimateEngine(flagsValue: flags.Registry): FunnelEstimateEngine {
  return new FunnelEstimateEngine(
    [
      new FunnelEstimateAttemptsOffsetAdjuster(0.17),
      new FlaggedFunnelEstimateAdjuster(flagsValue, "funnel-estimate-fallback", 5.6),
      new CapFunnelEstimateAdjuster(48580),
      new TieredFunnelEstimateAdjuster([4590, 9117], [1.12, 1.16]),
      new PercentFunnelEstimateAdjuster(-13.4),
    ],
    [],
    1.4,
    59784.6,
  );
}
