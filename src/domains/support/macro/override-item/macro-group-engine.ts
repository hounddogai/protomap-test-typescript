import * as numbers from "../../../../kit/numbers.js";
import { MacroGroup } from "./macro-group.js";

/** One step of the macro group calculation. */
export interface MacroGroupAdjuster {
  describe(): string;
  adjust(item: MacroGroup, value: number): number;
}

export class PercentMacroGroupAdjuster implements MacroGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingMacroGroupAdjuster implements MacroGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredMacroGroupAdjuster implements MacroGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapMacroGroupAdjuster implements MacroGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumMacroGroupAdjuster implements MacroGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the macro group steps in order and keeps a trace of each. */
export class MacroGroupEngine {
  steps: MacroGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MacroGroup): number {
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

  evaluateAll(items: MacroGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMacroGroupEngine(): MacroGroupEngine {
  return new MacroGroupEngine(
    [
      new PercentMacroGroupAdjuster(12),
      new RoundingMacroGroupAdjuster(0.05),
      new TieredMacroGroupAdjuster([241, 9960], [0.93, 0.92]),
      new CapMacroGroupAdjuster(21878),
      new MinimumMacroGroupAdjuster(18.8),
    ],
    [],
    1.8,
    62030.7,
  );
}
