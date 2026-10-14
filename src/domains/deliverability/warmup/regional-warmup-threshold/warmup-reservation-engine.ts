import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupReservation } from "./warmup-reservation.js";

/** One step of the warmup reservation calculation. */
export interface WarmupReservationFactor {
  describe(): string;
  adjust(item: WarmupReservation, value: number): number;
}

export class FlaggedWarmupReservationAdjuster implements WarmupReservationFactor {
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

  adjust(item: WarmupReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWarmupReservationAdjuster implements WarmupReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitWarmupReservationAdjuster implements WarmupReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: WarmupReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWarmupReservationAdjuster implements WarmupReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the warmup reservation steps in order and keeps a trace of each. */
export class WarmupReservationEngine {
  steps: WarmupReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WarmupReservation): number {
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

  evaluateAll(items: WarmupReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWarmupReservationEngine(flagsValue: flags.Registry): WarmupReservationEngine {
  return new WarmupReservationEngine(
    [
      new FlaggedWarmupReservationAdjuster(flagsValue, "warmup-reservation-weighted", -9.6),
      new CapWarmupReservationAdjuster(14076),
      new UnitWarmupReservationAdjuster(
        new Map<string, number>([["central", 0.77], ["east", 0.71], ["south", 0.9]]),
      ),
      new RoundingWarmupReservationAdjuster(0.25),
    ],
    [],
    0.5,
    91041.6,
  );
}
