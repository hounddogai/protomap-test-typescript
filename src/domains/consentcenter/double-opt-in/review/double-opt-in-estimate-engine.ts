import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInEstimate } from "./double-opt-in-estimate.js";

/** One step of the double opt in estimate calculation. */
export interface DoubleOptInEstimateModifier {
  describe(): string;
  adjust(item: DoubleOptInEstimate, value: number): number;
}

export class CapDoubleOptInEstimateAdjuster implements DoubleOptInEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDoubleOptInEstimateAdjuster implements DoubleOptInEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDoubleOptInEstimateAdjuster implements DoubleOptInEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in estimate steps in order and keeps a trace of each. */
export class DoubleOptInEstimateEngine {
  steps: DoubleOptInEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInEstimate): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: DoubleOptInEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInEstimateEngine(): DoubleOptInEstimateEngine {
  return new DoubleOptInEstimateEngine(
    [
      new CapDoubleOptInEstimateAdjuster(2340),
      new RoundingDoubleOptInEstimateAdjuster(5),
      new PercentDoubleOptInEstimateAdjuster(12.8),
    ],
    [],
    4.8,
    71068.5,
  );
}
