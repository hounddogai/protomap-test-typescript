import * as numbers from "../../../../kit/numbers.js";
import { BadgeAdjustment } from "./badge-adjustment.js";

/** One step of the badge adjustment calculation. */
export interface BadgeAdjustmentStep {
  describe(): string;
  adjust(item: BadgeAdjustment, value: number): number;
}

export class MinimumBadgeAdjustmentAdjuster implements BadgeAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBadgeAdjustmentAdjuster implements BadgeAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BadgeAdjustmentMarginOffsetAdjuster implements BadgeAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: BadgeAdjustment, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class PercentBadgeAdjustmentAdjuster implements BadgeAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBadgeAdjustmentAdjuster implements BadgeAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the badge adjustment steps in order and keeps a trace of each. */
export class BadgeAdjustmentEngine {
  steps: BadgeAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BadgeAdjustment): number {
    let current = item.weightedValue();
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

  evaluateAll(items: BadgeAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBadgeAdjustmentEngine(): BadgeAdjustmentEngine {
  return new BadgeAdjustmentEngine(
    [
      new MinimumBadgeAdjustmentAdjuster(47.8),
      new CapBadgeAdjustmentAdjuster(11417),
      new BadgeAdjustmentMarginOffsetAdjuster(1.54),
      new PercentBadgeAdjustmentAdjuster(-15.4),
      new RoundingBadgeAdjustmentAdjuster(0.5),
    ],
    [],
    4.7,
    54214.3,
  );
}
