import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPacingReservation } from "./default-pacing-reservation.js";

/** One step of the default pacing reservation calculation. */
export interface DefaultPacingReservationModifier {
  describe(): string;
  adjust(item: DefaultPacingReservation, value: number): number;
}

export class TieredDefaultPacingReservationAdjuster implements DefaultPacingReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPacingReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultPacingReservationAdjuster implements DefaultPacingReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPacingReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelDefaultPacingReservationAdjuster implements DefaultPacingReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultPacingReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDefaultPacingReservationAdjuster implements DefaultPacingReservationModifier {
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

  adjust(item: DefaultPacingReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultPacingReservationAdjuster implements DefaultPacingReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPacingReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultPacingReservationAdjuster implements DefaultPacingReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPacingReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default pacing reservation steps in order and keeps a trace of each. */
export class DefaultPacingReservationEngine {
  steps: DefaultPacingReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPacingReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultPacingReservation): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: DefaultPacingReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultPacingReservationEngine(flagsValue: flags.Registry): DefaultPacingReservationEngine {
  return new DefaultPacingReservationEngine(
    [
      new TieredDefaultPacingReservationAdjuster([894, 2326, 8419, 8554], [1.07, 1.12, 0.95, 0.91]),
      new MinimumDefaultPacingReservationAdjuster(48.2),
      new LabelDefaultPacingReservationAdjuster(new Map<string, number>([["central", 1], ["retail", 1.03]])),
      new FlaggedDefaultPacingReservationAdjuster(flagsValue, "default-pacing-reservation-rolling", 2.3),
      new CapDefaultPacingReservationAdjuster(4098),
      new RoundingDefaultPacingReservationAdjuster(0.1),
    ],
    [],
    1.7,
    61455.4,
  );
}
