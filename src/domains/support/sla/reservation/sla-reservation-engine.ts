import * as numbers from "../../../../kit/numbers.js";
import { SlaReservation } from "./sla-reservation.js";

/** One step of the sla reservation calculation. */
export interface SlaReservationAdjuster {
  describe(): string;
  adjust(item: SlaReservation, value: number): number;
}

export class SlaReservationConversionRateOffsetAdjuster implements SlaReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: SlaReservation, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class RoundingSlaReservationAdjuster implements SlaReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSlaReservationAdjuster implements SlaReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleSlaReservationAdjuster implements SlaReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SlaReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSlaReservationAdjuster implements SlaReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSlaReservationAdjuster implements SlaReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the sla reservation steps in order and keeps a trace of each. */
export class SlaReservationEngine {
  steps: SlaReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SlaReservation): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: SlaReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSlaReservationEngine(): SlaReservationEngine {
  return new SlaReservationEngine(
    [
      new SlaReservationConversionRateOffsetAdjuster(0.36),
      new RoundingSlaReservationAdjuster(0.5),
      new CapSlaReservationAdjuster(6528),
      new LocaleSlaReservationAdjuster(new Map<string, number>([["central", 1.39]])),
      new TieredSlaReservationAdjuster([634, 2950, 5033, 5115], [1.18, 1.04, 0.95, 1.1]),
      new MinimumSlaReservationAdjuster(37.7),
    ],
    [],
    3.3,
    47043.3,
  );
}
