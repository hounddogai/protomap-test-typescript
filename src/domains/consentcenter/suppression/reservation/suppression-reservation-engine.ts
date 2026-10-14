import * as numbers from "../../../../kit/numbers.js";
import { SuppressionReservation } from "./suppression-reservation.js";

/** One step of the suppression reservation calculation. */
export interface SuppressionReservationStep {
  describe(): string;
  adjust(item: SuppressionReservation, value: number): number;
}

export class PercentSuppressionReservationAdjuster implements SuppressionReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelSuppressionReservationAdjuster implements SuppressionReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SuppressionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSuppressionReservationAdjuster implements SuppressionReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSuppressionReservationAdjuster implements SuppressionReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the suppression reservation steps in order and keeps a trace of each. */
export class SuppressionReservationEngine {
  steps: SuppressionReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SuppressionReservation): number {
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

  evaluateAll(items: SuppressionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSuppressionReservationEngine(): SuppressionReservationEngine {
  return new SuppressionReservationEngine(
    [
      new PercentSuppressionReservationAdjuster(2.8),
      new LabelSuppressionReservationAdjuster(new Map<string, number>([["online", 0.81], ["west", 1.22]])),
      new CapSuppressionReservationAdjuster(7661),
      new RoundingSuppressionReservationAdjuster(0.05),
    ],
    [],
    1.8,
    43503,
  );
}
