import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFlightPolicy } from "./primary-flight-policy.js";

/** One step of the primary flight policy calculation. */
export interface PrimaryFlightPolicyStep {
  describe(): string;
  adjust(item: PrimaryFlightPolicy, value: number): number;
}

export class PrimaryFlightPolicyRateOffsetAdjuster implements PrimaryFlightPolicyStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: PrimaryFlightPolicy, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumPrimaryFlightPolicyAdjuster implements PrimaryFlightPolicyStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryFlightPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPrimaryFlightPolicyAdjuster implements PrimaryFlightPolicyStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryFlightPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimaryFlightPolicyAdjuster implements PrimaryFlightPolicyStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryFlightPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary flight policy steps in order and keeps a trace of each. */
export class PrimaryFlightPolicyEngine {
  steps: PrimaryFlightPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFlightPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryFlightPolicy): number {
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

  evaluateAll(items: PrimaryFlightPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryFlightPolicyEngine(): PrimaryFlightPolicyEngine {
  return new PrimaryFlightPolicyEngine(
    [
      new PrimaryFlightPolicyRateOffsetAdjuster(0.12),
      new MinimumPrimaryFlightPolicyAdjuster(30.5),
      new CapPrimaryFlightPolicyAdjuster(25635),
      new RoundingPrimaryFlightPolicyAdjuster(0.05),
    ],
    [],
    4.1,
    58277.1,
  );
}
