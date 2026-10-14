import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

/** One step of the scheduled funnel threshold calculation. */
export interface ScheduledFunnelThresholdFactor {
  describe(): string;
  adjust(item: ScheduledFunnelThreshold, value: number): number;
}

export class ScheduledFunnelThresholdScoreOffsetAdjuster implements ScheduledFunnelThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ScheduledFunnelThreshold, value: number): number {
    return value + item.score * this.weight;
  }
}

export class MinimumScheduledFunnelThresholdAdjuster implements ScheduledFunnelThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledFunnelThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedScheduledFunnelThresholdAdjuster implements ScheduledFunnelThresholdFactor {
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

  adjust(item: ScheduledFunnelThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledFunnelThresholdAdjuster implements ScheduledFunnelThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledFunnelThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleScheduledFunnelThresholdAdjuster implements ScheduledFunnelThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ScheduledFunnelThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledFunnelThresholdAdjuster implements ScheduledFunnelThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFunnelThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled funnel threshold steps in order and keeps a trace of each. */
export class ScheduledFunnelThresholdEngine {
  steps: ScheduledFunnelThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFunnelThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledFunnelThreshold): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledFunnelThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledFunnelThresholdEngine(flagsValue: flags.Registry): ScheduledFunnelThresholdEngine {
  return new ScheduledFunnelThresholdEngine(
    [
      new ScheduledFunnelThresholdScoreOffsetAdjuster(0.84),
      new MinimumScheduledFunnelThresholdAdjuster(28.4),
      new FlaggedScheduledFunnelThresholdAdjuster(flagsValue, "scheduled-funnel-threshold-batched", -1),
      new TieredScheduledFunnelThresholdAdjuster([3625, 7125, 9649], [0.88, 0.97, 1.11]),
      new TitleScheduledFunnelThresholdAdjuster(new Map<string, number>([["west", 1.08]])),
      new RoundingScheduledFunnelThresholdAdjuster(0.05),
    ],
    [],
    4.9,
    70228.6,
  );
}
