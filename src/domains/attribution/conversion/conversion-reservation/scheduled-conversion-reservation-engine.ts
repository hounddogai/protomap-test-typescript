import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

/** One step of the scheduled conversion reservation calculation. */
export interface ScheduledConversionReservationStep {
  describe(): string;
  adjust(item: ScheduledConversionReservation, value: number): number;
}

export class PercentScheduledConversionReservationAdjuster implements ScheduledConversionReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledConversionReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryScheduledConversionReservationAdjuster implements ScheduledConversionReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ScheduledConversionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedScheduledConversionReservationAdjuster implements ScheduledConversionReservationStep {
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

  adjust(item: ScheduledConversionReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledConversionReservationAdjuster implements ScheduledConversionReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledConversionReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledConversionReservationAdjuster implements ScheduledConversionReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledConversionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled conversion reservation steps in order and keeps a trace of each. */
export class ScheduledConversionReservationEngine {
  steps: ScheduledConversionReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledConversionReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledConversionReservation): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ScheduledConversionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledConversionReservationEngine(flagsValue: flags.Registry): ScheduledConversionReservationEngine {
  return new ScheduledConversionReservationEngine(
    [
      new PercentScheduledConversionReservationAdjuster(19.1),
      new CountryScheduledConversionReservationAdjuster(new Map<string, number>([["west", 0.89]])),
      new FlaggedScheduledConversionReservationAdjuster(
        flagsValue,
        "scheduled-conversion-reservation-seasonal",
        -2.9,
      ),
      new CapScheduledConversionReservationAdjuster(38529),
      new RoundingScheduledConversionReservationAdjuster(1),
    ],
    [],
    4.6,
    55541.5,
  );
}
