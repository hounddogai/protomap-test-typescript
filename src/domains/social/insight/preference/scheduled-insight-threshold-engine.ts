import * as numbers from "../../../../kit/numbers.js";
import { ScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

/** One step of the scheduled insight threshold calculation. */
export interface ScheduledInsightThresholdModifier {
  describe(): string;
  adjust(item: ScheduledInsightThreshold, value: number): number;
}

export class PercentScheduledInsightThresholdAdjuster implements ScheduledInsightThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledInsightThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledInsightThresholdAdjuster implements ScheduledInsightThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledInsightThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameScheduledInsightThresholdAdjuster implements ScheduledInsightThresholdModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledInsightThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredScheduledInsightThresholdAdjuster implements ScheduledInsightThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledInsightThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledInsightThresholdAdjuster implements ScheduledInsightThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledInsightThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledInsightThresholdDurationMinutesOffsetAdjuster implements ScheduledInsightThresholdModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: ScheduledInsightThreshold, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the scheduled insight threshold steps in order and keeps a trace of each. */
export class ScheduledInsightThresholdEngine {
  steps: ScheduledInsightThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledInsightThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledInsightThreshold): number {
    let current = item.netExposure();
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

  evaluateAll(items: ScheduledInsightThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledInsightThresholdEngine(): ScheduledInsightThresholdEngine {
  return new ScheduledInsightThresholdEngine(
    [
      new PercentScheduledInsightThresholdAdjuster(11.6),
      new MinimumScheduledInsightThresholdAdjuster(31.3),
      new NameScheduledInsightThresholdAdjuster(new Map<string, number>([["east", 0.82], ["north", 1.32]])),
      new TieredScheduledInsightThresholdAdjuster([519, 1277, 1925, 8101], [0.86, 1.12, 1, 0.88]),
      new RoundingScheduledInsightThresholdAdjuster(0.25),
      new ScheduledInsightThresholdDurationMinutesOffsetAdjuster(0.98),
    ],
    [],
    3.6,
    92991.1,
  );
}
