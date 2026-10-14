import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyWaitReservation } from "./legacy-wait-reservation.js";

/** One step of the legacy wait reservation calculation. */
export interface LegacyWaitReservationFactor {
  describe(): string;
  adjust(item: LegacyWaitReservation, value: number): number;
}

export class CapLegacyWaitReservationAdjuster implements LegacyWaitReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyWaitReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLegacyWaitReservationAdjuster implements LegacyWaitReservationFactor {
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

  adjust(item: LegacyWaitReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLegacyWaitReservationAdjuster implements LegacyWaitReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyWaitReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyWaitReservationAdjuster implements LegacyWaitReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyWaitReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LegacyWaitReservationRateOffsetAdjuster implements LegacyWaitReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: LegacyWaitReservation, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class RoundingLegacyWaitReservationAdjuster implements LegacyWaitReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyWaitReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy wait reservation steps in order and keeps a trace of each. */
export class LegacyWaitReservationEngine {
  steps: LegacyWaitReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyWaitReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyWaitReservation): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LegacyWaitReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyWaitReservationEngine(flagsValue: flags.Registry): LegacyWaitReservationEngine {
  return new LegacyWaitReservationEngine(
    [
      new CapLegacyWaitReservationAdjuster(10592),
      new FlaggedLegacyWaitReservationAdjuster(flagsValue, "legacy-wait-reservation-strict", 2.6),
      new PercentLegacyWaitReservationAdjuster(11.7),
      new MinimumLegacyWaitReservationAdjuster(46.4),
      new LegacyWaitReservationRateOffsetAdjuster(0.84),
      new RoundingLegacyWaitReservationAdjuster(5),
    ],
    [],
    0.4,
    49869.2,
  );
}
