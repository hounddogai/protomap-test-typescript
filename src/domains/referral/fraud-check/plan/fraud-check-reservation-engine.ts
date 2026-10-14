import * as flags from "../../../../kit/flags.js";
import { FraudCheckReservation } from "./fraud-check-reservation.js";

/** One step of the fraud check reservation calculation. */
export interface FraudCheckReservationAdjuster {
  describe(): string;
  adjust(item: FraudCheckReservation, value: number): number;
}

export class PercentFraudCheckReservationAdjuster implements FraudCheckReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFraudCheckReservationAdjuster implements FraudCheckReservationAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: FraudCheckReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFraudCheckReservationAdjuster implements FraudCheckReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fraud check reservation steps in order and keeps a trace of each. */
export class FraudCheckReservationEngine {
  steps: FraudCheckReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FraudCheckReservation): number {
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

  evaluateAll(items: FraudCheckReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFraudCheckReservationEngine(flagsValue: flags.Registry): FraudCheckReservationEngine {
  return new FraudCheckReservationEngine(
    [
      new PercentFraudCheckReservationAdjuster(-15.8),
      new FlaggedFraudCheckReservationAdjuster(flagsValue, "fraud-check-reservation-tiered", 2),
      new TieredFraudCheckReservationAdjuster([1736, 2904, 8885, 9173], [0.86, 0.84, 1.03, 1.1]),
    ],
    [],
    2.4,
    26725.3,
  );
}
