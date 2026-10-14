import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimarySlaReservation } from "./primary-sla-reservation.js";

/** One step of the primary sla reservation calculation. */
export interface PrimarySlaReservationFactor {
  describe(): string;
  adjust(item: PrimarySlaReservation, value: number): number;
}

export class TieredPrimarySlaReservationAdjuster implements PrimarySlaReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySlaReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPrimarySlaReservationAdjuster implements PrimarySlaReservationFactor {
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

  adjust(item: PrimarySlaReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimarySlaReservationFloorValueOffsetAdjuster implements PrimarySlaReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: PrimarySlaReservation, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class MinimumPrimarySlaReservationAdjuster implements PrimarySlaReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimarySlaReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPrimarySlaReservationAdjuster implements PrimarySlaReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimarySlaReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimarySlaReservationAdjuster implements PrimarySlaReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySlaReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary sla reservation steps in order and keeps a trace of each. */
export class PrimarySlaReservationEngine {
  steps: PrimarySlaReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySlaReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimarySlaReservation): number {
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

  evaluateAll(items: PrimarySlaReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimarySlaReservationEngine(flagsValue: flags.Registry): PrimarySlaReservationEngine {
  return new PrimarySlaReservationEngine(
    [
      new TieredPrimarySlaReservationAdjuster([32, 4885], [0.94, 0.97]),
      new FlaggedPrimarySlaReservationAdjuster(flagsValue, "primary-sla-reservation-primary", -8.6),
      new PrimarySlaReservationFloorValueOffsetAdjuster(0.24),
      new MinimumPrimarySlaReservationAdjuster(6),
      new RoundingPrimarySlaReservationAdjuster(0.05),
      new CapPrimarySlaReservationAdjuster(32571),
    ],
    [],
    3.4,
    51708.8,
  );
}
