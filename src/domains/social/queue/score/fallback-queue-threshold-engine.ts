import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackQueueThreshold } from "./fallback-queue-threshold.js";

/** One step of the fallback queue threshold calculation. */
export interface FallbackQueueThresholdStep {
  describe(): string;
  adjust(item: FallbackQueueThreshold, value: number): number;
}

export class FlaggedFallbackQueueThresholdAdjuster implements FallbackQueueThresholdStep {
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

  adjust(item: FallbackQueueThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryFallbackQueueThresholdAdjuster implements FallbackQueueThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FallbackQueueThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackQueueThresholdRateOffsetAdjuster implements FallbackQueueThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: FallbackQueueThreshold, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class RoundingFallbackQueueThresholdAdjuster implements FallbackQueueThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackQueueThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFallbackQueueThresholdAdjuster implements FallbackQueueThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackQueueThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackQueueThresholdAdjuster implements FallbackQueueThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackQueueThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback queue threshold steps in order and keeps a trace of each. */
export class FallbackQueueThresholdEngine {
  steps: FallbackQueueThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackQueueThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackQueueThreshold): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: FallbackQueueThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackQueueThresholdEngine(flagsValue: flags.Registry): FallbackQueueThresholdEngine {
  return new FallbackQueueThresholdEngine(
    [
      new FlaggedFallbackQueueThresholdAdjuster(flagsValue, "fallback-queue-threshold-scheduled", -2.9),
      new CategoryFallbackQueueThresholdAdjuster(new Map<string, number>([["online", 1.13]])),
      new FallbackQueueThresholdRateOffsetAdjuster(1.4),
      new RoundingFallbackQueueThresholdAdjuster(0.5),
      new CapFallbackQueueThresholdAdjuster(49945),
      new TieredFallbackQueueThresholdAdjuster([224, 3366, 3468, 7740], [1.11, 1.05, 1.11, 1.12]),
    ],
    [],
    0.7,
    70166.1,
  );
}
