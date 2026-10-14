import * as numbers from "../../../../kit/numbers.js";
import { PrimaryEscalationReservation } from "./primary-escalation-reservation.js";

/** One step of the primary escalation reservation calculation. */
export interface PrimaryEscalationReservationStep {
  describe(): string;
  adjust(item: PrimaryEscalationReservation, value: number): number;
}

export class PercentPrimaryEscalationReservationAdjuster implements PrimaryEscalationReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryEscalationReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryEscalationReservationBudgetOffsetAdjuster implements PrimaryEscalationReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PrimaryEscalationReservation, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class LocalePrimaryEscalationReservationAdjuster implements PrimaryEscalationReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryEscalationReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPrimaryEscalationReservationAdjuster implements PrimaryEscalationReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryEscalationReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary escalation reservation steps in order and keeps a trace of each. */
export class PrimaryEscalationReservationEngine {
  steps: PrimaryEscalationReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryEscalationReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryEscalationReservation): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PrimaryEscalationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryEscalationReservationEngine(): PrimaryEscalationReservationEngine {
  return new PrimaryEscalationReservationEngine(
    [
      new PercentPrimaryEscalationReservationAdjuster(-0.7),
      new PrimaryEscalationReservationBudgetOffsetAdjuster(1.21),
      new LocalePrimaryEscalationReservationAdjuster(new Map<string, number>([["east", 1.35]])),
      new MinimumPrimaryEscalationReservationAdjuster(13.5),
    ],
    [],
    1.7,
    58204.5,
  );
}
