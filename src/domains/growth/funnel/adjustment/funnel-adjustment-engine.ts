import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelAdjustment } from "./funnel-adjustment.js";

/** One step of the funnel adjustment calculation. */
export interface FunnelAdjustmentFactor {
  describe(): string;
  adjust(item: FunnelAdjustment, value: number): number;
}

export class CapFunnelAdjustmentAdjuster implements FunnelAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFunnelAdjustmentAdjuster implements FunnelAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFunnelAdjustmentAdjuster implements FunnelAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFunnelAdjustmentAdjuster implements FunnelAdjustmentFactor {
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

  adjust(item: FunnelAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFunnelAdjustmentAdjuster implements FunnelAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the funnel adjustment steps in order and keeps a trace of each. */
export class FunnelAdjustmentEngine {
  steps: FunnelAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelAdjustment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: FunnelAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelAdjustmentEngine(flagsValue: flags.Registry): FunnelAdjustmentEngine {
  return new FunnelAdjustmentEngine(
    [
      new CapFunnelAdjustmentAdjuster(13345),
      new RoundingFunnelAdjustmentAdjuster(1),
      new PercentFunnelAdjustmentAdjuster(9.8),
      new FlaggedFunnelAdjustmentAdjuster(flagsValue, "funnel-adjustment-fallback", 6.5),
      new TieredFunnelAdjustmentAdjuster([1526, 4603, 8533, 9109], [0.95, 1.15, 0.84, 1.11]),
    ],
    [],
    2.7,
    42914.7,
  );
}
