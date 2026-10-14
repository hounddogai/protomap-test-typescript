import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackSuppressionReservation } from "./fallback-suppression-reservation.js";

/** One step of the fallback suppression reservation calculation. */
export interface FallbackSuppressionReservationStep {
  describe(): string;
  adjust(item: FallbackSuppressionReservation, value: number): number;
}

export class RoundingFallbackSuppressionReservationAdjuster implements FallbackSuppressionReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSuppressionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackSuppressionReservationCapacityOffsetAdjuster implements FallbackSuppressionReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: FallbackSuppressionReservation, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class TieredFallbackSuppressionReservationAdjuster implements FallbackSuppressionReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackSuppressionReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackSuppressionReservationAdjuster implements FallbackSuppressionReservationStep {
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

  adjust(item: FallbackSuppressionReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitFallbackSuppressionReservationAdjuster implements FallbackSuppressionReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: FallbackSuppressionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackSuppressionReservationAdjuster implements FallbackSuppressionReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSuppressionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback suppression reservation steps in order and keeps a trace of each. */
export class FallbackSuppressionReservationEngine {
  steps: FallbackSuppressionReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSuppressionReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackSuppressionReservation): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FallbackSuppressionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackSuppressionReservationEngine(flagsValue: flags.Registry): FallbackSuppressionReservationEngine {
  return new FallbackSuppressionReservationEngine(
    [
      new RoundingFallbackSuppressionReservationAdjuster(0.5),
      new FallbackSuppressionReservationCapacityOffsetAdjuster(1.23),
      new TieredFallbackSuppressionReservationAdjuster([1636, 6574], [1.09, 0.89]),
      new FlaggedFallbackSuppressionReservationAdjuster(
        flagsValue,
        "fallback-suppression-reservation-primary",
        4.9,
      ),
      new UnitFallbackSuppressionReservationAdjuster(new Map<string, number>([["online", 0.97]])),
      new MinimumFallbackSuppressionReservationAdjuster(28.3),
    ],
    [],
    2.7,
    38064.3,
  );
}
