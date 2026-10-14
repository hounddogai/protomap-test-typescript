import * as numbers from "../../../../kit/numbers.js";
import { ApprovalReservation } from "./approval-reservation.js";

/** One step of the approval reservation calculation. */
export interface ApprovalReservationModifier {
  describe(): string;
  adjust(item: ApprovalReservation, value: number): number;
}

export class RoundingApprovalReservationAdjuster implements ApprovalReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapApprovalReservationAdjuster implements ApprovalReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredApprovalReservationAdjuster implements ApprovalReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentApprovalReservationAdjuster implements ApprovalReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ApprovalReservationVersionOffsetAdjuster implements ApprovalReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ApprovalReservation, value: number): number {
    return value + item.version * this.weight;
  }
}

export class UtmSourceApprovalReservationAdjuster implements ApprovalReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ApprovalReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the approval reservation steps in order and keeps a trace of each. */
export class ApprovalReservationEngine {
  steps: ApprovalReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalReservation): number {
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

  evaluateAll(items: ApprovalReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalReservationEngine(): ApprovalReservationEngine {
  return new ApprovalReservationEngine(
    [
      new RoundingApprovalReservationAdjuster(0.05),
      new CapApprovalReservationAdjuster(46360),
      new TieredApprovalReservationAdjuster([3636, 3719], [0.94, 1.06]),
      new PercentApprovalReservationAdjuster(2.5),
      new ApprovalReservationVersionOffsetAdjuster(1.43),
      new UtmSourceApprovalReservationAdjuster(
        new Map<string, number>([["north", 0.86], ["east", 1.17], ["central", 0.87]]),
      ),
    ],
    [],
    0.8,
    51442.3,
  );
}
