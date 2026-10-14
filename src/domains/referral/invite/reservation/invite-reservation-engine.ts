import { InviteReservation } from "./invite-reservation.js";

/** One step of the invite reservation calculation. */
export interface InviteReservationStep {
  describe(): string;
  adjust(item: InviteReservation, value: number): number;
}

export class RegionInviteReservationAdjuster implements InviteReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: InviteReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredInviteReservationAdjuster implements InviteReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumInviteReservationAdjuster implements InviteReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class InviteReservationDurationMinutesOffsetAdjuster implements InviteReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: InviteReservation, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapInviteReservationAdjuster implements InviteReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the invite reservation steps in order and keeps a trace of each. */
export class InviteReservationEngine {
  steps: InviteReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InviteReservation): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: InviteReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInviteReservationEngine(): InviteReservationEngine {
  return new InviteReservationEngine(
    [
      new RegionInviteReservationAdjuster(new Map<string, number>([["west", 0.81]])),
      new TieredInviteReservationAdjuster([6259, 6967], [0.83, 0.88]),
      new MinimumInviteReservationAdjuster(22.8),
      new InviteReservationDurationMinutesOffsetAdjuster(1.42),
      new CapInviteReservationAdjuster(24051),
    ],
    [],
    0.6,
    20757.1,
  );
}
