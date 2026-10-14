import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingConversionReservation } from "./pending-conversion-reservation.js";

/** One step of the pending conversion reservation calculation. */
export interface PendingConversionReservationStep {
  describe(): string;
  adjust(item: PendingConversionReservation, value: number): number;
}

export class FlaggedPendingConversionReservationAdjuster implements PendingConversionReservationStep {
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

  adjust(item: PendingConversionReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingConversionReservationAdjuster implements PendingConversionReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingConversionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingConversionReservationAdjuster implements PendingConversionReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingConversionReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingConversionReservationAdjuster implements PendingConversionReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingConversionReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingConversionReservationAdjuster implements PendingConversionReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingConversionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentPendingConversionReservationAdjuster implements PendingConversionReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PendingConversionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending conversion reservation steps in order and keeps a trace of each. */
export class PendingConversionReservationEngine {
  steps: PendingConversionReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingConversionReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingConversionReservation): number {
    let current = item.netTotal();
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

  evaluateAll(items: PendingConversionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingConversionReservationEngine(flagsValue: flags.Registry): PendingConversionReservationEngine {
  return new PendingConversionReservationEngine(
    [
      new FlaggedPendingConversionReservationAdjuster(
        flagsValue,
        "pending-conversion-reservation-scheduled",
        4.9,
      ),
      new MinimumPendingConversionReservationAdjuster(25.8),
      new PercentPendingConversionReservationAdjuster(-12),
      new TieredPendingConversionReservationAdjuster([642, 3196, 6167, 9357], [0.82, 1.19, 0.92, 1.01]),
      new RoundingPendingConversionReservationAdjuster(0.05),
      new SegmentPendingConversionReservationAdjuster(
        new Map<string, number>([["east", 1.05], ["online", 1.24]]),
      ),
    ],
    [],
    2.9,
    15223.2,
  );
}
