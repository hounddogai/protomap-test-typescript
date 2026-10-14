import * as numbers from "../../../../kit/numbers.js";
import { SeasonalQueueReservation } from "./seasonal-queue-reservation.js";

/** One step of the seasonal queue reservation calculation. */
export interface SeasonalQueueReservationAdjuster {
  describe(): string;
  adjust(item: SeasonalQueueReservation, value: number): number;
}

export class CapSeasonalQueueReservationAdjuster implements SeasonalQueueReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalQueueReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleSeasonalQueueReservationAdjuster implements SeasonalQueueReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SeasonalQueueReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalQueueReservationQuantityOffsetAdjuster implements SeasonalQueueReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: SeasonalQueueReservation, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the seasonal queue reservation steps in order and keeps a trace of each. */
export class SeasonalQueueReservationEngine {
  steps: SeasonalQueueReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalQueueReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalQueueReservation): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: SeasonalQueueReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalQueueReservationEngine(): SeasonalQueueReservationEngine {
  return new SeasonalQueueReservationEngine(
    [
      new CapSeasonalQueueReservationAdjuster(30638),
      new LocaleSeasonalQueueReservationAdjuster(new Map<string, number>([["east", 1.04], ["online", 0.72]])),
      new SeasonalQueueReservationQuantityOffsetAdjuster(1.02),
    ],
    [],
    0.5,
    82135.6,
  );
}
