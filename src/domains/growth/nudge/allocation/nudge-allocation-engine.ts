import * as numbers from "../../../../kit/numbers.js";
import { NudgeAllocation } from "./nudge-allocation.js";

/** One step of the nudge allocation calculation. */
export interface NudgeAllocationModifier {
  describe(): string;
  adjust(item: NudgeAllocation, value: number): number;
}

export class CapNudgeAllocationAdjuster implements NudgeAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingNudgeAllocationAdjuster implements NudgeAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameNudgeAllocationAdjuster implements NudgeAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: NudgeAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredNudgeAllocationAdjuster implements NudgeAllocationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumNudgeAllocationAdjuster implements NudgeAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentNudgeAllocationAdjuster implements NudgeAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge allocation steps in order and keeps a trace of each. */
export class NudgeAllocationEngine {
  steps: NudgeAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: NudgeAllocation): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: NudgeAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultNudgeAllocationEngine(): NudgeAllocationEngine {
  return new NudgeAllocationEngine(
    [
      new CapNudgeAllocationAdjuster(11842),
      new RoundingNudgeAllocationAdjuster(0.25),
      new NameNudgeAllocationAdjuster(new Map<string, number>([["retail", 0.75], ["north", 0.89]])),
      new TieredNudgeAllocationAdjuster([1508, 1981, 2705, 7524], [1.19, 1.16, 1.03, 1.13]),
      new MinimumNudgeAllocationAdjuster(47.6),
      new PercentNudgeAllocationAdjuster(4.7),
    ],
    [],
    4.9,
    61502.6,
  );
}
