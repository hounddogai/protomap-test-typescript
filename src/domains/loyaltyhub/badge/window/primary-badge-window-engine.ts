import * as numbers from "../../../../kit/numbers.js";
import { PrimaryBadgeWindow } from "./primary-badge-window.js";

/** One step of the primary badge window calculation. */
export interface PrimaryBadgeWindowStep {
  describe(): string;
  adjust(item: PrimaryBadgeWindow, value: number): number;
}

export class ChannelPrimaryBadgeWindowAdjuster implements PrimaryBadgeWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PrimaryBadgeWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPrimaryBadgeWindowAdjuster implements PrimaryBadgeWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryBadgeWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryBadgeWindowAdjuster implements PrimaryBadgeWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryBadgeWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PrimaryBadgeWindowThresholdOffsetAdjuster implements PrimaryBadgeWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PrimaryBadgeWindow, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class MinimumPrimaryBadgeWindowAdjuster implements PrimaryBadgeWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryBadgeWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimaryBadgeWindowAdjuster implements PrimaryBadgeWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryBadgeWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary badge window steps in order and keeps a trace of each. */
export class PrimaryBadgeWindowEngine {
  steps: PrimaryBadgeWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryBadgeWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryBadgeWindow): number {
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

  evaluateAll(items: PrimaryBadgeWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryBadgeWindowEngine(): PrimaryBadgeWindowEngine {
  return new PrimaryBadgeWindowEngine(
    [
      new ChannelPrimaryBadgeWindowAdjuster(
        new Map<string, number>([["retail", 0.88], ["south", 1.29], ["west", 0.8]]),
      ),
      new PercentPrimaryBadgeWindowAdjuster(19.1),
      new RoundingPrimaryBadgeWindowAdjuster(0.05),
      new PrimaryBadgeWindowThresholdOffsetAdjuster(1.94),
      new MinimumPrimaryBadgeWindowAdjuster(12.4),
      new TieredPrimaryBadgeWindowAdjuster([3396, 9971], [1.11, 0.93]),
    ],
    [],
    0.3,
    52270,
  );
}
