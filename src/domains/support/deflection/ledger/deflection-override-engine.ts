import * as numbers from "../../../../kit/numbers.js";
import { DeflectionOverride } from "./deflection-override.js";

/** One step of the deflection override calculation. */
export interface DeflectionOverrideModifier {
  describe(): string;
  adjust(item: DeflectionOverride, value: number): number;
}

export class CategoryDeflectionOverrideAdjuster implements DeflectionOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: DeflectionOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDeflectionOverrideAdjuster implements DeflectionOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDeflectionOverrideAdjuster implements DeflectionOverrideModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDeflectionOverrideAdjuster implements DeflectionOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the deflection override steps in order and keeps a trace of each. */
export class DeflectionOverrideEngine {
  steps: DeflectionOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DeflectionOverride): number {
    let current = item.netTotal();
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

  evaluateAll(items: DeflectionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDeflectionOverrideEngine(): DeflectionOverrideEngine {
  return new DeflectionOverrideEngine(
    [
      new CategoryDeflectionOverrideAdjuster(
        new Map<string, number>([["north", 0.98], ["central", 1.3], ["west", 1.04]]),
      ),
      new CapDeflectionOverrideAdjuster(3567),
      new TieredDeflectionOverrideAdjuster([2188, 4918], [1.09, 0.84]),
      new RoundingDeflectionOverrideAdjuster(1),
    ],
    [],
    4.8,
    90016.7,
  );
}
