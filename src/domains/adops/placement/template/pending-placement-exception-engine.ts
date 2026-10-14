import { PendingPlacementException } from "./pending-placement-exception.js";

/** One step of the pending placement exception calculation. */
export interface PendingPlacementExceptionModifier {
  describe(): string;
  adjust(item: PendingPlacementException, value: number): number;
}

export class PendingPlacementExceptionMaximumOffsetAdjuster implements PendingPlacementExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: PendingPlacementException, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class MinimumPendingPlacementExceptionAdjuster implements PendingPlacementExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPlacementException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingPlacementExceptionAdjuster implements PendingPlacementExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPlacementException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingPlacementExceptionAdjuster implements PendingPlacementExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingPlacementException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending placement exception steps in order and keeps a trace of each. */
export class PendingPlacementExceptionEngine {
  steps: PendingPlacementExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPlacementExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingPlacementException): number {
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

  evaluateAll(items: PendingPlacementException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingPlacementExceptionEngine(): PendingPlacementExceptionEngine {
  return new PendingPlacementExceptionEngine(
    [
      new PendingPlacementExceptionMaximumOffsetAdjuster(1.11),
      new MinimumPendingPlacementExceptionAdjuster(6),
      new CapPendingPlacementExceptionAdjuster(21328),
      new TieredPendingPlacementExceptionAdjuster([43, 7876, 9073], [1.19, 0.83, 0.83]),
    ],
    [],
    1.6,
    88487.6,
  );
}
