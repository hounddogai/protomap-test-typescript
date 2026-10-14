import * as numbers from "../../../../kit/numbers.js";
import { ModelReservation } from "./model-reservation.js";

/** One step of the model reservation calculation. */
export interface ModelReservationFactor {
  describe(): string;
  adjust(item: ModelReservation, value: number): number;
}

export class CapModelReservationAdjuster implements ModelReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceModelReservationAdjuster implements ModelReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ModelReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ModelReservationStartsAtOffsetAdjuster implements ModelReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: ModelReservation, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class TieredModelReservationAdjuster implements ModelReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumModelReservationAdjuster implements ModelReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingModelReservationAdjuster implements ModelReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the model reservation steps in order and keeps a trace of each. */
export class ModelReservationEngine {
  steps: ModelReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ModelReservation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ModelReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultModelReservationEngine(): ModelReservationEngine {
  return new ModelReservationEngine(
    [
      new CapModelReservationAdjuster(21994),
      new SourceModelReservationAdjuster(
        new Map<string, number>([["retail", 0.97], ["south", 1.07], ["east", 0.95]]),
      ),
      new ModelReservationStartsAtOffsetAdjuster(1.01),
      new TieredModelReservationAdjuster([1262, 3301, 5944, 8089], [0.85, 1.17, 0.95, 0.93]),
      new MinimumModelReservationAdjuster(0.8),
      new RoundingModelReservationAdjuster(0.1),
    ],
    [],
    0.6,
    89047.2,
  );
}
