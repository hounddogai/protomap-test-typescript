import * as numbers from "../../../../kit/numbers.js";
import { RollingCreditRequest } from "./rolling-credit-request.js";

/** One step of the rolling credit request calculation. */
export interface RollingCreditRequestStep {
  describe(): string;
  adjust(item: RollingCreditRequest, value: number): number;
}

export class CapRollingCreditRequestAdjuster implements RollingCreditRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingCreditRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRollingCreditRequestAdjuster implements RollingCreditRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingCreditRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRollingCreditRequestAdjuster implements RollingCreditRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingCreditRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingCreditRequestAttemptsOffsetAdjuster implements RollingCreditRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: RollingCreditRequest, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the rolling credit request steps in order and keeps a trace of each. */
export class RollingCreditRequestEngine {
  steps: RollingCreditRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingCreditRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingCreditRequest): number {
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

  evaluateAll(items: RollingCreditRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingCreditRequestEngine(): RollingCreditRequestEngine {
  return new RollingCreditRequestEngine(
    [
      new CapRollingCreditRequestAdjuster(8718),
      new MinimumRollingCreditRequestAdjuster(34.9),
      new RoundingRollingCreditRequestAdjuster(0.05),
      new RollingCreditRequestAttemptsOffsetAdjuster(0.48),
    ],
    [],
    2.7,
    97952.8,
  );
}
