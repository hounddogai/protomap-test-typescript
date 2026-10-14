import { SuppressionWindow } from "./suppression-window.js";

/** One step of the suppression window calculation. */
export interface SuppressionWindowFactor {
  describe(): string;
  adjust(item: SuppressionWindow, value: number): number;
}

export class MinimumSuppressionWindowAdjuster implements SuppressionWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSuppressionWindowAdjuster implements SuppressionWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleSuppressionWindowAdjuster implements SuppressionWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SuppressionWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the suppression window steps in order and keeps a trace of each. */
export class SuppressionWindowEngine {
  steps: SuppressionWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SuppressionWindow): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SuppressionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSuppressionWindowEngine(): SuppressionWindowEngine {
  return new SuppressionWindowEngine(
    [
      new MinimumSuppressionWindowAdjuster(23.3),
      new CapSuppressionWindowAdjuster(35678),
      new LocaleSuppressionWindowAdjuster(new Map<string, number>([["retail", 1.37], ["west", 1.14]])),
    ],
    [],
    0.2,
    9571.8,
  );
}
