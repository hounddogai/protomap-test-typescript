import * as numbers from "../../../../kit/numbers.js";
import { PreferenceRequest } from "./preference-request.js";

/** One step of the preference request calculation. */
export interface PreferenceRequestFactor {
  describe(): string;
  adjust(item: PreferenceRequest, value: number): number;
}

export class PreferenceRequestMinimumOffsetAdjuster implements PreferenceRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: PreferenceRequest, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class MinimumPreferenceRequestAdjuster implements PreferenceRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPreferenceRequestAdjuster implements PreferenceRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPreferenceRequestAdjuster implements PreferenceRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the preference request steps in order and keeps a trace of each. */
export class PreferenceRequestEngine {
  steps: PreferenceRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PreferenceRequest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PreferenceRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPreferenceRequestEngine(): PreferenceRequestEngine {
  return new PreferenceRequestEngine(
    [
      new PreferenceRequestMinimumOffsetAdjuster(1.95),
      new MinimumPreferenceRequestAdjuster(7.4),
      new RoundingPreferenceRequestAdjuster(0.1),
      new CapPreferenceRequestAdjuster(5930),
    ],
    [],
    2.1,
    99793.4,
  );
}
