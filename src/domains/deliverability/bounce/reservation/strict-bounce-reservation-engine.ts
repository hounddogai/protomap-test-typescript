import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictBounceReservation } from "./strict-bounce-reservation.js";

/** One step of the strict bounce reservation calculation. */
export interface StrictBounceReservationAdjuster {
  describe(): string;
  adjust(item: StrictBounceReservation, value: number): number;
}

export class CapStrictBounceReservationAdjuster implements StrictBounceReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictBounceReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictBounceReservationAdjuster implements StrictBounceReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictBounceReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedStrictBounceReservationAdjuster implements StrictBounceReservationAdjuster {
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

  adjust(item: StrictBounceReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict bounce reservation steps in order and keeps a trace of each. */
export class StrictBounceReservationEngine {
  steps: StrictBounceReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBounceReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictBounceReservation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictBounceReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictBounceReservationEngine(flagsValue: flags.Registry): StrictBounceReservationEngine {
  return new StrictBounceReservationEngine(
    [
      new CapStrictBounceReservationAdjuster(5202),
      new RoundingStrictBounceReservationAdjuster(0.25),
      new FlaggedStrictBounceReservationAdjuster(flagsValue, "strict-bounce-reservation-primary", 5.6),
    ],
    [],
    1.9,
    38523.3,
  );
}
