import { WindowReservation } from "./window-reservation.js";

/** One step of the window reservation calculation. */
export interface WindowReservationFactor {
  describe(): string;
  adjust(item: WindowReservation, value: number): number;
}

export class LocaleWindowReservationAdjuster implements WindowReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WindowReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWindowReservationAdjuster implements WindowReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWindowReservationAdjuster implements WindowReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WindowReservationMaximumOffsetAdjuster implements WindowReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: WindowReservation, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the window reservation steps in order and keeps a trace of each. */
export class WindowReservationEngine {
  steps: WindowReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowReservation): number {
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

  evaluateAll(items: WindowReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowReservationEngine(): WindowReservationEngine {
  return new WindowReservationEngine(
    [
      new LocaleWindowReservationAdjuster(
        new Map<string, number>([["online", 1.34], ["south", 0.97], ["north", 1.18]]),
      ),
      new TieredWindowReservationAdjuster([3298, 3602, 4951, 7441], [1.03, 1.13, 0.83, 1.02]),
      new PercentWindowReservationAdjuster(-3.4),
      new WindowReservationMaximumOffsetAdjuster(0.9),
    ],
    [],
    1.9,
    89489.4,
  );
}
