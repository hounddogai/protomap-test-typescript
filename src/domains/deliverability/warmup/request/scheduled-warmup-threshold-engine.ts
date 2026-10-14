import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

/** One step of the scheduled warmup threshold calculation. */
export interface ScheduledWarmupThresholdModifier {
  describe(): string;
  adjust(item: ScheduledWarmupThreshold, value: number): number;
}

export class TitleScheduledWarmupThresholdAdjuster implements ScheduledWarmupThresholdModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ScheduledWarmupThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledWarmupThresholdAdjuster implements ScheduledWarmupThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledWarmupThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentScheduledWarmupThresholdAdjuster implements ScheduledWarmupThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWarmupThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledWarmupThresholdAdjuster implements ScheduledWarmupThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWarmupThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledWarmupThresholdAdjuster implements ScheduledWarmupThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledWarmupThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapScheduledWarmupThresholdAdjuster implements ScheduledWarmupThresholdModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledWarmupThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled warmup threshold steps in order and keeps a trace of each. */
export class ScheduledWarmupThresholdEngine {
  steps: ScheduledWarmupThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWarmupThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledWarmupThreshold): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ScheduledWarmupThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledWarmupThresholdEngine(): ScheduledWarmupThresholdEngine {
  return new ScheduledWarmupThresholdEngine(
    [
      new TitleScheduledWarmupThresholdAdjuster(
        new Map<string, number>([["east", 0.73], ["south", 0.85], ["west", 1.32]]),
      ),
      new MinimumScheduledWarmupThresholdAdjuster(14.9),
      new PercentScheduledWarmupThresholdAdjuster(-5),
      new RoundingScheduledWarmupThresholdAdjuster(0.5),
      new TieredScheduledWarmupThresholdAdjuster([2034, 2346, 3716, 8756], [1.02, 1.02, 0.94, 1.15]),
      new CapScheduledWarmupThresholdAdjuster(37168),
    ],
    [],
    2.5,
    23372.6,
  );
}
