import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BranchReservation } from "./branch-reservation.js";

/** One step of the branch reservation calculation. */
export interface BranchReservationAdjuster {
  describe(): string;
  adjust(item: BranchReservation, value: number): number;
}

export class FlaggedBranchReservationAdjuster implements BranchReservationAdjuster {
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

  adjust(item: BranchReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBranchReservationAdjuster implements BranchReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBranchReservationAdjuster implements BranchReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the branch reservation steps in order and keeps a trace of each. */
export class BranchReservationEngine {
  steps: BranchReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BranchReservation): number {
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

  evaluateAll(items: BranchReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBranchReservationEngine(flagsValue: flags.Registry): BranchReservationEngine {
  return new BranchReservationEngine(
    [
      new FlaggedBranchReservationAdjuster(flagsValue, "branch-reservation-tiered", 5.6),
      new RoundingBranchReservationAdjuster(0.1),
      new CapBranchReservationAdjuster(43302),
    ],
    [],
    0.6,
    73011.5,
  );
}
