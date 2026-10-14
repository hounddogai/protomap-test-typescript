import * as numbers from "../../../../kit/numbers.js";
import { CappedPathAllocation } from "./capped-path-allocation.js";

/** One step of the capped path allocation calculation. */
export interface CappedPathAllocationModifier {
  describe(): string;
  adjust(item: CappedPathAllocation, value: number): number;
}

export class CapCappedPathAllocationAdjuster implements CappedPathAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedPathAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedPathAllocationAdjuster implements CappedPathAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedPathAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCappedPathAllocationAdjuster implements CappedPathAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedPathAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedPathAllocationMaximumOffsetAdjuster implements CappedPathAllocationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: CappedPathAllocation, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class MinimumCappedPathAllocationAdjuster implements CappedPathAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedPathAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameCappedPathAllocationAdjuster implements CappedPathAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedPathAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped path allocation steps in order and keeps a trace of each. */
export class CappedPathAllocationEngine {
  steps: CappedPathAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPathAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedPathAllocation): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: CappedPathAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedPathAllocationEngine(): CappedPathAllocationEngine {
  return new CappedPathAllocationEngine(
    [
      new CapCappedPathAllocationAdjuster(37487),
      new RoundingCappedPathAllocationAdjuster(1),
      new PercentCappedPathAllocationAdjuster(19.4),
      new CappedPathAllocationMaximumOffsetAdjuster(0.06),
      new MinimumCappedPathAllocationAdjuster(1.5),
      new NameCappedPathAllocationAdjuster(new Map<string, number>([["east", 1.17]])),
    ],
    [],
    1.1,
    40420.6,
  );
}
