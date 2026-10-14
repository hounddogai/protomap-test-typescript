import * as numbers from "../../../../kit/numbers.js";
import { TieredOptOutWindow } from "./tiered-opt-out-window.js";

/** One step of the tiered opt out window calculation. */
export interface TieredOptOutWindowAdjuster {
  describe(): string;
  adjust(item: TieredOptOutWindow, value: number): number;
}

export class CapTieredOptOutWindowAdjuster implements TieredOptOutWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredOptOutWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredOptOutWindowAdjuster implements TieredOptOutWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredOptOutWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredOptOutWindowRatioOffsetAdjuster implements TieredOptOutWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: TieredOptOutWindow, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class RoundingTieredOptOutWindowAdjuster implements TieredOptOutWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredOptOutWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered opt out window steps in order and keeps a trace of each. */
export class TieredOptOutWindowEngine {
  steps: TieredOptOutWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredOptOutWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredOptOutWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredOptOutWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredOptOutWindowEngine(): TieredOptOutWindowEngine {
  return new TieredOptOutWindowEngine(
    [
      new CapTieredOptOutWindowAdjuster(26937),
      new MinimumTieredOptOutWindowAdjuster(37.7),
      new TieredOptOutWindowRatioOffsetAdjuster(0.36),
      new RoundingTieredOptOutWindowAdjuster(0.25),
    ],
    [],
    3.5,
    38699,
  );
}
