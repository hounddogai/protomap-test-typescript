import * as numbers from "../../../../kit/numbers.js";
import { ActivationReservation } from "./activation-reservation.js";

/** One step of the activation reservation calculation. */
export interface ActivationReservationStep {
  describe(): string;
  adjust(item: ActivationReservation, value: number): number;
}

export class TieredActivationReservationAdjuster implements ActivationReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumActivationReservationAdjuster implements ActivationReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelActivationReservationAdjuster implements ActivationReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ActivationReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the activation reservation steps in order and keeps a trace of each. */
export class ActivationReservationEngine {
  steps: ActivationReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ActivationReservation): number {
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

  evaluateAll(items: ActivationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultActivationReservationEngine(): ActivationReservationEngine {
  return new ActivationReservationEngine(
    [
      new TieredActivationReservationAdjuster([4286, 4846, 5219, 7102], [0.91, 0.82, 0.94, 0.84]),
      new MinimumActivationReservationAdjuster(44.8),
      new LabelActivationReservationAdjuster(
        new Map<string, number>([["east", 0.75], ["north", 0.75], ["central", 1.06]]),
      ),
    ],
    [],
    0.8,
    46847.7,
  );
}
