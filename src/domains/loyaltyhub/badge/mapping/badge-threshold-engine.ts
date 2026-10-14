import * as numbers from "../../../../kit/numbers.js";
import { BadgeThreshold } from "./badge-threshold.js";

/** One step of the badge threshold calculation. */
export interface BadgeThresholdFactor {
  describe(): string;
  adjust(item: BadgeThreshold, value: number): number;
}

export class RoundingBadgeThresholdAdjuster implements BadgeThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBadgeThresholdAdjuster implements BadgeThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBadgeThresholdAdjuster implements BadgeThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBadgeThresholdAdjuster implements BadgeThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BadgeThresholdWindowDaysOffsetAdjuster implements BadgeThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: BadgeThreshold, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class CapBadgeThresholdAdjuster implements BadgeThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the badge threshold steps in order and keeps a trace of each. */
export class BadgeThresholdEngine {
  steps: BadgeThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BadgeThreshold): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: BadgeThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBadgeThresholdEngine(): BadgeThresholdEngine {
  return new BadgeThresholdEngine(
    [
      new RoundingBadgeThresholdAdjuster(0.1),
      new PercentBadgeThresholdAdjuster(-15.2),
      new TieredBadgeThresholdAdjuster([2639, 4554], [0.86, 0.98]),
      new MinimumBadgeThresholdAdjuster(30.5),
      new BadgeThresholdWindowDaysOffsetAdjuster(1.5),
      new CapBadgeThresholdAdjuster(5860),
    ],
    [],
    2.1,
    91785,
  );
}
