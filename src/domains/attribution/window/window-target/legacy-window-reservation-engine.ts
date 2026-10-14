import * as numbers from "../../../../kit/numbers.js";
import { LegacyWindowReservation } from "./legacy-window-reservation.js";

/** One step of the legacy window reservation calculation. */
export interface LegacyWindowReservationFactor {
  describe(): string;
  adjust(item: LegacyWindowReservation, value: number): number;
}

export class RoundingLegacyWindowReservationAdjuster implements LegacyWindowReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyWindowReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LegacyWindowReservationThresholdOffsetAdjuster implements LegacyWindowReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: LegacyWindowReservation, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class LabelLegacyWindowReservationAdjuster implements LegacyWindowReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyWindowReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyWindowReservationAdjuster implements LegacyWindowReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyWindowReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLegacyWindowReservationAdjuster implements LegacyWindowReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyWindowReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy window reservation steps in order and keeps a trace of each. */
export class LegacyWindowReservationEngine {
  steps: LegacyWindowReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyWindowReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyWindowReservation): number {
    let current = item.netExposure();
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

  evaluateAll(items: LegacyWindowReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyWindowReservationEngine(): LegacyWindowReservationEngine {
  return new LegacyWindowReservationEngine(
    [
      new RoundingLegacyWindowReservationAdjuster(1),
      new LegacyWindowReservationThresholdOffsetAdjuster(1.97),
      new LabelLegacyWindowReservationAdjuster(
        new Map<string, number>([["online", 1.32], ["north", 0.94], ["east", 1.29]]),
      ),
      new MinimumLegacyWindowReservationAdjuster(47.3),
      new TieredLegacyWindowReservationAdjuster([4445, 5255, 7455], [0.94, 0.89, 0.89]),
    ],
    [],
    4.4,
    61271.9,
  );
}
