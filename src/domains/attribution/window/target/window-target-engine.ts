import * as numbers from "../../../../kit/numbers.js";
import { WindowTarget } from "./window-target.js";

/** One step of the window target calculation. */
export interface WindowTargetStep {
  describe(): string;
  adjust(item: WindowTarget, value: number): number;
}

export class TieredWindowTargetAdjuster implements WindowTargetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWindowTargetAdjuster implements WindowTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWindowTargetAdjuster implements WindowTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WindowTargetEndsAtOffsetAdjuster implements WindowTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: WindowTarget, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RoundingWindowTargetAdjuster implements WindowTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameWindowTargetAdjuster implements WindowTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WindowTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the window target steps in order and keeps a trace of each. */
export class WindowTargetEngine {
  steps: WindowTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WindowTarget): number {
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

  evaluateAll(items: WindowTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWindowTargetEngine(): WindowTargetEngine {
  return new WindowTargetEngine(
    [
      new TieredWindowTargetAdjuster([931, 4978, 5961, 7655], [0.98, 0.84, 1.05, 0.9]),
      new MinimumWindowTargetAdjuster(45.8),
      new CapWindowTargetAdjuster(26648),
      new WindowTargetEndsAtOffsetAdjuster(0.3),
      new RoundingWindowTargetAdjuster(0.1),
      new NameWindowTargetAdjuster(new Map<string, number>([["south", 1.3], ["west", 1.16], ["east", 0.9]])),
    ],
    [],
    2.2,
    95890.4,
  );
}
