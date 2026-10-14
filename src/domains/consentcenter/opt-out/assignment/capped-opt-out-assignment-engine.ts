import * as numbers from "../../../../kit/numbers.js";
import { CappedOptOutAssignment } from "./capped-opt-out-assignment.js";

/** One step of the capped opt out assignment calculation. */
export interface CappedOptOutAssignmentStep {
  describe(): string;
  adjust(item: CappedOptOutAssignment, value: number): number;
}

export class CapCappedOptOutAssignmentAdjuster implements CappedOptOutAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedOptOutAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedOptOutAssignmentMarginOffsetAdjuster implements CappedOptOutAssignmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: CappedOptOutAssignment, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class TitleCappedOptOutAssignmentAdjuster implements CappedOptOutAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedOptOutAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingCappedOptOutAssignmentAdjuster implements CappedOptOutAssignmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedOptOutAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCappedOptOutAssignmentAdjuster implements CappedOptOutAssignmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedOptOutAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedOptOutAssignmentAdjuster implements CappedOptOutAssignmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedOptOutAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped opt out assignment steps in order and keeps a trace of each. */
export class CappedOptOutAssignmentEngine {
  steps: CappedOptOutAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedOptOutAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedOptOutAssignment): number {
    let current = item.netLoad();
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

  evaluateAll(items: CappedOptOutAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedOptOutAssignmentEngine(): CappedOptOutAssignmentEngine {
  return new CappedOptOutAssignmentEngine(
    [
      new CapCappedOptOutAssignmentAdjuster(13037),
      new CappedOptOutAssignmentMarginOffsetAdjuster(1.98),
      new TitleCappedOptOutAssignmentAdjuster(new Map<string, number>([["retail", 1.22], ["east", 1.37]])),
      new RoundingCappedOptOutAssignmentAdjuster(0.5),
      new TieredCappedOptOutAssignmentAdjuster([2591, 6559], [0.92, 0.89]),
      new MinimumCappedOptOutAssignmentAdjuster(15.2),
    ],
    [],
    4,
    30467.1,
  );
}
