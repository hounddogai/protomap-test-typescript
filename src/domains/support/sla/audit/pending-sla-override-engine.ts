import { PendingSlaOverride } from "./pending-sla-override.js";

/** One step of the pending sla override calculation. */
export interface PendingSlaOverrideStep {
  describe(): string;
  adjust(item: PendingSlaOverride, value: number): number;
}

export class PendingSlaOverrideFloorValueOffsetAdjuster implements PendingSlaOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: PendingSlaOverride, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapPendingSlaOverrideAdjuster implements PendingSlaOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSlaOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryPendingSlaOverrideAdjuster implements PendingSlaOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PendingSlaOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingSlaOverrideAdjuster implements PendingSlaOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSlaOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending sla override steps in order and keeps a trace of each. */
export class PendingSlaOverrideEngine {
  steps: PendingSlaOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSlaOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingSlaOverride): number {
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

  evaluateAll(items: PendingSlaOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingSlaOverrideEngine(): PendingSlaOverrideEngine {
  return new PendingSlaOverrideEngine(
    [
      new PendingSlaOverrideFloorValueOffsetAdjuster(1.99),
      new CapPendingSlaOverrideAdjuster(46151),
      new CategoryPendingSlaOverrideAdjuster(new Map<string, number>([["west", 0.79]])),
      new MinimumPendingSlaOverrideAdjuster(43.4),
    ],
    [],
    4.8,
    22993,
  );
}
