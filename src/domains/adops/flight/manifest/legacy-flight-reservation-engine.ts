import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyFlightReservation } from "./legacy-flight-reservation.js";

/** One step of the legacy flight reservation calculation. */
export interface LegacyFlightReservationFactor {
  describe(): string;
  adjust(item: LegacyFlightReservation, value: number): number;
}

export class PercentLegacyFlightReservationAdjuster implements LegacyFlightReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyFlightReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyFlightReservationAdjuster implements LegacyFlightReservationFactor {
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

  adjust(item: LegacyFlightReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyFlightReservationAdjuster implements LegacyFlightReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFlightReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitLegacyFlightReservationAdjuster implements LegacyFlightReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LegacyFlightReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy flight reservation steps in order and keeps a trace of each. */
export class LegacyFlightReservationEngine {
  steps: LegacyFlightReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFlightReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyFlightReservation): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacyFlightReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyFlightReservationEngine(flagsValue: flags.Registry): LegacyFlightReservationEngine {
  return new LegacyFlightReservationEngine(
    [
      new PercentLegacyFlightReservationAdjuster(-16.8),
      new FlaggedLegacyFlightReservationAdjuster(flagsValue, "legacy-flight-reservation-capped", 7.4),
      new TieredLegacyFlightReservationAdjuster([3043, 5130], [1.19, 1.04]),
      new UnitLegacyFlightReservationAdjuster(
        new Map<string, number>([["west", 1.14], ["east", 0.97], ["online", 1.4]]),
      ),
    ],
    [],
    2.3,
    44895.2,
  );
}
