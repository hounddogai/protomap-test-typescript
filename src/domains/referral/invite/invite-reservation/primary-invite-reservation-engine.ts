import * as numbers from "../../../../kit/numbers.js";
import { PrimaryInviteReservation } from "./primary-invite-reservation.js";

/** One step of the primary invite reservation calculation. */
export interface PrimaryInviteReservationFactor {
  describe(): string;
  adjust(item: PrimaryInviteReservation, value: number): number;
}

export class PercentPrimaryInviteReservationAdjuster implements PrimaryInviteReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryInviteReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryInviteReservationRateOffsetAdjuster implements PrimaryInviteReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: PrimaryInviteReservation, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class RoundingPrimaryInviteReservationAdjuster implements PrimaryInviteReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryInviteReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryInviteReservationAdjuster implements PrimaryInviteReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryInviteReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPrimaryInviteReservationAdjuster implements PrimaryInviteReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryInviteReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NamePrimaryInviteReservationAdjuster implements PrimaryInviteReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryInviteReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary invite reservation steps in order and keeps a trace of each. */
export class PrimaryInviteReservationEngine {
  steps: PrimaryInviteReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInviteReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryInviteReservation): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryInviteReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryInviteReservationEngine(): PrimaryInviteReservationEngine {
  return new PrimaryInviteReservationEngine(
    [
      new PercentPrimaryInviteReservationAdjuster(-1.5),
      new PrimaryInviteReservationRateOffsetAdjuster(1.82),
      new RoundingPrimaryInviteReservationAdjuster(0.1),
      new CapPrimaryInviteReservationAdjuster(35881),
      new MinimumPrimaryInviteReservationAdjuster(13),
      new NamePrimaryInviteReservationAdjuster(new Map<string, number>([["west", 0.77], ["retail", 0.83]])),
    ],
    [],
    3.1,
    54800.3,
  );
}
