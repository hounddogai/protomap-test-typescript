import * as numbers from "../../../../kit/numbers.js";
import { RollingMacroCycle } from "./rolling-macro-cycle.js";

/** One step of the rolling macro cycle calculation. */
export interface RollingMacroCycleModifier {
  describe(): string;
  adjust(item: RollingMacroCycle, value: number): number;
}

export class TieredRollingMacroCycleAdjuster implements RollingMacroCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingMacroCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRollingMacroCycleAdjuster implements RollingMacroCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingMacroCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRollingMacroCycleAdjuster implements RollingMacroCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingMacroCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingMacroCycleAdjuster implements RollingMacroCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingMacroCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling macro cycle steps in order and keeps a trace of each. */
export class RollingMacroCycleEngine {
  steps: RollingMacroCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingMacroCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingMacroCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingMacroCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingMacroCycleEngine(): RollingMacroCycleEngine {
  return new RollingMacroCycleEngine(
    [
      new TieredRollingMacroCycleAdjuster([1579, 6176, 8957], [1.07, 0.89, 0.99]),
      new MinimumRollingMacroCycleAdjuster(22),
      new RoundingRollingMacroCycleAdjuster(0.05),
      new CapRollingMacroCycleAdjuster(21502),
    ],
    [],
    0.6,
    97406.1,
  );
}
