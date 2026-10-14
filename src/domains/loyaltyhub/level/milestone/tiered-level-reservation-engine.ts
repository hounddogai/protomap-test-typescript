import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredLevelReservation } from "./tiered-level-reservation.js";

/** One step of the tiered level reservation calculation. */
export interface TieredLevelReservationStep {
  describe(): string;
  adjust(item: TieredLevelReservation, value: number): number;
}

export class CapTieredLevelReservationAdjuster implements TieredLevelReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredLevelReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredLevelReservationAdjuster implements TieredLevelReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredLevelReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryTieredLevelReservationAdjuster implements TieredLevelReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TieredLevelReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTieredLevelReservationAdjuster implements TieredLevelReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredLevelReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredLevelReservationAdjuster implements TieredLevelReservationStep {
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

  adjust(item: TieredLevelReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered level reservation steps in order and keeps a trace of each. */
export class TieredLevelReservationEngine {
  steps: TieredLevelReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredLevelReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredLevelReservation): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: TieredLevelReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredLevelReservationEngine(flagsValue: flags.Registry): TieredLevelReservationEngine {
  return new TieredLevelReservationEngine(
    [
      new CapTieredLevelReservationAdjuster(2010),
      new TieredTieredLevelReservationAdjuster([1547, 6319, 6942, 8311], [0.92, 0.88, 0.98, 1.02]),
      new CategoryTieredLevelReservationAdjuster(new Map<string, number>([["north", 0.85]])),
      new RoundingTieredLevelReservationAdjuster(1),
      new FlaggedTieredLevelReservationAdjuster(flagsValue, "tiered-level-reservation-lenient", -4.4),
    ],
    [],
    4.2,
    72817,
  );
}
