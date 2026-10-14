import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFunnelVariance } from "./scheduled-funnel-variance.js";

/** One step of the scheduled funnel variance calculation. */
export interface ScheduledFunnelVarianceStep {
  describe(): string;
  adjust(item: ScheduledFunnelVariance, value: number): number;
}

export class ScheduledFunnelVarianceRatioOffsetAdjuster implements ScheduledFunnelVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ScheduledFunnelVariance, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class RoundingScheduledFunnelVarianceAdjuster implements ScheduledFunnelVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFunnelVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledFunnelVarianceAdjuster implements ScheduledFunnelVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFunnelVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedScheduledFunnelVarianceAdjuster implements ScheduledFunnelVarianceStep {
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

  adjust(item: ScheduledFunnelVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledFunnelVarianceAdjuster implements ScheduledFunnelVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledFunnelVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentScheduledFunnelVarianceAdjuster implements ScheduledFunnelVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledFunnelVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled funnel variance steps in order and keeps a trace of each. */
export class ScheduledFunnelVarianceEngine {
  steps: ScheduledFunnelVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFunnelVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledFunnelVariance): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ScheduledFunnelVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledFunnelVarianceEngine(flagsValue: flags.Registry): ScheduledFunnelVarianceEngine {
  return new ScheduledFunnelVarianceEngine(
    [
      new ScheduledFunnelVarianceRatioOffsetAdjuster(1.12),
      new RoundingScheduledFunnelVarianceAdjuster(0.25),
      new CapScheduledFunnelVarianceAdjuster(20034),
      new FlaggedScheduledFunnelVarianceAdjuster(flagsValue, "scheduled-funnel-variance-regional", 1.5),
      new TieredScheduledFunnelVarianceAdjuster([1085, 1530, 5566], [0.99, 0.84, 1.19]),
      new PercentScheduledFunnelVarianceAdjuster(-16.9),
    ],
    [],
    2.6,
    26314.2,
  );
}
