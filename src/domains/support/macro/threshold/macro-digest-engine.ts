import * as numbers from "../../../../kit/numbers.js";
import { MacroDigest } from "./macro-digest.js";

/** One step of the macro digest calculation. */
export interface MacroDigestAdjuster {
  describe(): string;
  adjust(item: MacroDigest, value: number): number;
}

export class TieredMacroDigestAdjuster implements MacroDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumMacroDigestAdjuster implements MacroDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class MacroDigestAmountOffsetAdjuster implements MacroDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: MacroDigest, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingMacroDigestAdjuster implements MacroDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the macro digest steps in order and keeps a trace of each. */
export class MacroDigestEngine {
  steps: MacroDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MacroDigest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: MacroDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMacroDigestEngine(): MacroDigestEngine {
  return new MacroDigestEngine(
    [
      new TieredMacroDigestAdjuster([2801, 3174, 5655], [0.94, 0.99, 0.89]),
      new MinimumMacroDigestAdjuster(12.9),
      new MacroDigestAmountOffsetAdjuster(0.29),
      new RoundingMacroDigestAdjuster(0.1),
    ],
    [],
    3,
    29965.8,
  );
}
