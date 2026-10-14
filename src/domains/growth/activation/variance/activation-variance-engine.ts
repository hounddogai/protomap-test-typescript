import { ActivationVariance } from "./activation-variance.js";

/** One step of the activation variance calculation. */
export interface ActivationVarianceAdjuster {
  describe(): string;
  adjust(item: ActivationVariance, value: number): number;
}

export class CapActivationVarianceAdjuster implements ActivationVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumActivationVarianceAdjuster implements ActivationVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameActivationVarianceAdjuster implements ActivationVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ActivationVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the activation variance steps in order and keeps a trace of each. */
export class ActivationVarianceEngine {
  steps: ActivationVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationVariance): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ActivationVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationVarianceEngine(): ActivationVarianceEngine {
  return new ActivationVarianceEngine(
    [
      new CapActivationVarianceAdjuster(21476),
      new MinimumActivationVarianceAdjuster(3.4),
      new NameActivationVarianceAdjuster(new Map<string, number>([["south", 0.84]])),
    ],
    [],
    0,
    6500,
  );
}
