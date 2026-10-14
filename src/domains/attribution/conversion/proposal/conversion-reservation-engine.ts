import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionReservation } from "./conversion-reservation.js";

/** One step of the conversion reservation calculation. */
export interface ConversionReservationStep {
  describe(): string;
  adjust(item: ConversionReservation, value: number): number;
}

export class CapConversionReservationAdjuster implements ConversionReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentConversionReservationAdjuster implements ConversionReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingConversionReservationAdjuster implements ConversionReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumConversionReservationAdjuster implements ConversionReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ConversionReservationEndsAtOffsetAdjuster implements ConversionReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ConversionReservation, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class FlaggedConversionReservationAdjuster implements ConversionReservationStep {
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

  adjust(item: ConversionReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion reservation steps in order and keeps a trace of each. */
export class ConversionReservationEngine {
  steps: ConversionReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ConversionReservation): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ConversionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultConversionReservationEngine(flagsValue: flags.Registry): ConversionReservationEngine {
  return new ConversionReservationEngine(
    [
      new CapConversionReservationAdjuster(33238),
      new PercentConversionReservationAdjuster(24.1),
      new RoundingConversionReservationAdjuster(0.1),
      new MinimumConversionReservationAdjuster(37.6),
      new ConversionReservationEndsAtOffsetAdjuster(1.39),
      new FlaggedConversionReservationAdjuster(flagsValue, "conversion-reservation-strict", -8.2),
    ],
    [],
    2.5,
    97027.2,
  );
}
