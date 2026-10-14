import * as numbers from "../../../../kit/numbers.js";
import { TieredPlacementReservation } from "./tiered-placement-reservation.js";

/** One step of the tiered placement reservation calculation. */
export interface TieredPlacementReservationStep {
  describe(): string;
  adjust(item: TieredPlacementReservation, value: number): number;
}

export class CapTieredPlacementReservationAdjuster implements TieredPlacementReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPlacementReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredPlacementReservationAdjuster implements TieredPlacementReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPlacementReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPlacementReservationMarginOffsetAdjuster implements TieredPlacementReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: TieredPlacementReservation, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class RoundingTieredPlacementReservationAdjuster implements TieredPlacementReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredPlacementReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered placement reservation steps in order and keeps a trace of each. */
export class TieredPlacementReservationEngine {
  steps: TieredPlacementReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPlacementReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredPlacementReservation): number {
    let current = item.netVolume();
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

  evaluateAll(items: TieredPlacementReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredPlacementReservationEngine(): TieredPlacementReservationEngine {
  return new TieredPlacementReservationEngine(
    [
      new CapTieredPlacementReservationAdjuster(41572),
      new MinimumTieredPlacementReservationAdjuster(30.8),
      new TieredPlacementReservationMarginOffsetAdjuster(0.53),
      new RoundingTieredPlacementReservationAdjuster(0.05),
    ],
    [],
    4.1,
    9036.3,
  );
}
