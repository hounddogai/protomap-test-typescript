import * as numbers from "../../../../kit/numbers.js";
import { DefaultStreakReservation } from "./default-streak-reservation.js";

/** One step of the default streak reservation calculation. */
export interface DefaultStreakReservationAdjuster {
  describe(): string;
  adjust(item: DefaultStreakReservation, value: number): number;
}

export class CapDefaultStreakReservationAdjuster implements DefaultStreakReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultStreakReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDefaultStreakReservationAdjuster implements DefaultStreakReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultStreakReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultStreakReservationAdjuster implements DefaultStreakReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultStreakReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultStreakReservationAdjuster implements DefaultStreakReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultStreakReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default streak reservation steps in order and keeps a trace of each. */
export class DefaultStreakReservationEngine {
  steps: DefaultStreakReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultStreakReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultStreakReservation): number {
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

  evaluateAll(items: DefaultStreakReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultStreakReservationEngine(): DefaultStreakReservationEngine {
  return new DefaultStreakReservationEngine(
    [
      new CapDefaultStreakReservationAdjuster(11002),
      new MinimumDefaultStreakReservationAdjuster(1.1),
      new PercentDefaultStreakReservationAdjuster(19.4),
      new RoundingDefaultStreakReservationAdjuster(1),
    ],
    [],
    4.8,
    70871.6,
  );
}
