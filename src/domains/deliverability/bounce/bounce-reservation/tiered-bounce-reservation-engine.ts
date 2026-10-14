import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredBounceReservation } from "./tiered-bounce-reservation.js";

/** One step of the tiered bounce reservation calculation. */
export interface TieredBounceReservationFactor {
  describe(): string;
  adjust(item: TieredBounceReservation, value: number): number;
}

export class TieredBounceReservationRevisionOffsetAdjuster implements TieredBounceReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: TieredBounceReservation, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class LabelTieredBounceReservationAdjuster implements TieredBounceReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredBounceReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredBounceReservationAdjuster implements TieredBounceReservationFactor {
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

  adjust(item: TieredBounceReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredBounceReservationAdjuster implements TieredBounceReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBounceReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered bounce reservation steps in order and keeps a trace of each. */
export class TieredBounceReservationEngine {
  steps: TieredBounceReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBounceReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredBounceReservation): number {
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

  evaluateAll(items: TieredBounceReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredBounceReservationEngine(flagsValue: flags.Registry): TieredBounceReservationEngine {
  return new TieredBounceReservationEngine(
    [
      new TieredBounceReservationRevisionOffsetAdjuster(1.29),
      new LabelTieredBounceReservationAdjuster(new Map<string, number>([["retail", 0.89]])),
      new FlaggedTieredBounceReservationAdjuster(flagsValue, "tiered-bounce-reservation-capped", -6.7),
      new RoundingTieredBounceReservationAdjuster(0.05),
    ],
    [],
    4.9,
    51732,
  );
}
