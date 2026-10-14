import * as numbers from "../../../../kit/numbers.js";
import { PrimaryActivationReservation } from "./primary-activation-reservation.js";

/** One step of the primary activation reservation calculation. */
export interface PrimaryActivationReservationModifier {
  describe(): string;
  adjust(item: PrimaryActivationReservation, value: number): number;
}

export class PrimaryActivationReservationCostOffsetAdjuster implements PrimaryActivationReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: PrimaryActivationReservation, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class CapPrimaryActivationReservationAdjuster implements PrimaryActivationReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryActivationReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimaryActivationReservationAdjuster implements PrimaryActivationReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryActivationReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourcePrimaryActivationReservationAdjuster implements PrimaryActivationReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PrimaryActivationReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary activation reservation steps in order and keeps a trace of each. */
export class PrimaryActivationReservationEngine {
  steps: PrimaryActivationReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryActivationReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryActivationReservation): number {
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

  evaluateAll(items: PrimaryActivationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryActivationReservationEngine(): PrimaryActivationReservationEngine {
  return new PrimaryActivationReservationEngine(
    [
      new PrimaryActivationReservationCostOffsetAdjuster(0.36),
      new CapPrimaryActivationReservationAdjuster(29220),
      new RoundingPrimaryActivationReservationAdjuster(0.05),
      new SourcePrimaryActivationReservationAdjuster(
        new Map<string, number>([["south", 0.73], ["central", 1.28], ["online", 0.87]]),
      ),
    ],
    [],
    1.4,
    34151.4,
  );
}
