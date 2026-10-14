import * as numbers from "../../../../kit/numbers.js";
import { ManualFrequencyRequest } from "./manual-frequency-request.js";

/** One step of the manual frequency request calculation. */
export interface ManualFrequencyRequestFactor {
  describe(): string;
  adjust(item: ManualFrequencyRequest, value: number): number;
}

export class RoundingManualFrequencyRequestAdjuster implements ManualFrequencyRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualFrequencyRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapManualFrequencyRequestAdjuster implements ManualFrequencyRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualFrequencyRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualFrequencyRequestAdjuster implements ManualFrequencyRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualFrequencyRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualFrequencyRequestRevisionOffsetAdjuster implements ManualFrequencyRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ManualFrequencyRequest, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the manual frequency request steps in order and keeps a trace of each. */
export class ManualFrequencyRequestEngine {
  steps: ManualFrequencyRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualFrequencyRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualFrequencyRequest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ManualFrequencyRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualFrequencyRequestEngine(): ManualFrequencyRequestEngine {
  return new ManualFrequencyRequestEngine(
    [
      new RoundingManualFrequencyRequestAdjuster(0.1),
      new CapManualFrequencyRequestAdjuster(49488),
      new TieredManualFrequencyRequestAdjuster([2209, 2691, 5520, 9237], [0.92, 0.98, 1.05, 1.05]),
      new ManualFrequencyRequestRevisionOffsetAdjuster(1.21),
    ],
    [],
    1.3,
    69208.2,
  );
}
