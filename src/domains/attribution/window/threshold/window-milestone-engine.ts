import * as numbers from "../../../../kit/numbers.js";
import { WindowMilestone } from "./window-milestone.js";

/** One step of the window milestone calculation. */
export interface WindowMilestoneModifier {
  describe(): string;
  adjust(item: WindowMilestone, value: number): number;
}

export class WindowMilestoneRatioOffsetAdjuster implements WindowMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: WindowMilestone, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapWindowMilestoneAdjuster implements WindowMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWindowMilestoneAdjuster implements WindowMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWindowMilestoneAdjuster implements WindowMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWindowMilestoneAdjuster implements WindowMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window milestone steps in order and keeps a trace of each. */
export class WindowMilestoneEngine {
  steps: WindowMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WindowMilestone): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: WindowMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWindowMilestoneEngine(): WindowMilestoneEngine {
  return new WindowMilestoneEngine(
    [
      new WindowMilestoneRatioOffsetAdjuster(0.87),
      new CapWindowMilestoneAdjuster(30134),
      new RoundingWindowMilestoneAdjuster(0.05),
      new MinimumWindowMilestoneAdjuster(20.6),
      new PercentWindowMilestoneAdjuster(16.2),
    ],
    [],
    3.6,
    55583.4,
  );
}
