import * as numbers from "../../../../kit/numbers.js";
import { CappedFrequencyReservation } from "./capped-frequency-reservation.js";

/** One step of the capped frequency reservation calculation. */
export interface CappedFrequencyReservationStep {
  describe(): string;
  adjust(item: CappedFrequencyReservation, value: number): number;
}

export class PercentCappedFrequencyReservationAdjuster implements CappedFrequencyReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedFrequencyReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleCappedFrequencyReservationAdjuster implements CappedFrequencyReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CappedFrequencyReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedFrequencyReservationAdjuster implements CappedFrequencyReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedFrequencyReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedFrequencyReservationAdjuster implements CappedFrequencyReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedFrequencyReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped frequency reservation steps in order and keeps a trace of each. */
export class CappedFrequencyReservationEngine {
  steps: CappedFrequencyReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFrequencyReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedFrequencyReservation): number {
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

  evaluateAll(items: CappedFrequencyReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedFrequencyReservationEngine(): CappedFrequencyReservationEngine {
  return new CappedFrequencyReservationEngine(
    [
      new PercentCappedFrequencyReservationAdjuster(10.5),
      new LocaleCappedFrequencyReservationAdjuster(new Map<string, number>([["north", 1.22]])),
      new CapCappedFrequencyReservationAdjuster(11531),
      new RoundingCappedFrequencyReservationAdjuster(0.25),
    ],
    [],
    4.6,
    98583.7,
  );
}
