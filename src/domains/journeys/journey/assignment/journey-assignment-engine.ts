import * as numbers from "../../../../kit/numbers.js";
import { JourneyAssignment } from "./journey-assignment.js";

/** One step of the journey assignment calculation. */
export interface JourneyAssignmentModifier {
  describe(): string;
  adjust(item: JourneyAssignment, value: number): number;
}

export class RoundingJourneyAssignmentAdjuster implements JourneyAssignmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredJourneyAssignmentAdjuster implements JourneyAssignmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapJourneyAssignmentAdjuster implements JourneyAssignmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the journey assignment steps in order and keeps a trace of each. */
export class JourneyAssignmentEngine {
  steps: JourneyAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: JourneyAssignment): number {
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

  evaluateAll(items: JourneyAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultJourneyAssignmentEngine(): JourneyAssignmentEngine {
  return new JourneyAssignmentEngine(
    [
      new RoundingJourneyAssignmentAdjuster(5),
      new TieredJourneyAssignmentAdjuster([2475, 7636, 8871], [0.94, 1.07, 1.04]),
      new CapJourneyAssignmentAdjuster(42537),
    ],
    [],
    0.3,
    72865.3,
  );
}
