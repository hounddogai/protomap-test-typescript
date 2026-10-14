import { ActivationEntry } from "./activation-entry.js";

/** One step of the activation entry calculation. */
export interface ActivationEntryStep {
  describe(): string;
  adjust(item: ActivationEntry, value: number): number;
}

export class NameActivationEntryAdjuster implements ActivationEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ActivationEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapActivationEntryAdjuster implements ActivationEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumActivationEntryAdjuster implements ActivationEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredActivationEntryAdjuster implements ActivationEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the activation entry steps in order and keeps a trace of each. */
export class ActivationEntryEngine {
  steps: ActivationEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ActivationEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationEntryEngine(): ActivationEntryEngine {
  return new ActivationEntryEngine(
    [
      new NameActivationEntryAdjuster(new Map<string, number>([["west", 0.73], ["online", 1.03]])),
      new CapActivationEntryAdjuster(2308),
      new MinimumActivationEntryAdjuster(31.7),
      new TieredActivationEntryAdjuster([641, 653, 3949, 9458], [1.15, 1.1, 1.07, 1.06]),
    ],
    [],
    3.7,
    67921.1,
  );
}
