import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingReplyReservation } from "./pending-reply-reservation.js";

/** One step of the pending reply reservation calculation. */
export interface PendingReplyReservationStep {
  describe(): string;
  adjust(item: PendingReplyReservation, value: number): number;
}

export class RoundingPendingReplyReservationAdjuster implements PendingReplyReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingReplyReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPendingReplyReservationAdjuster implements PendingReplyReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingReplyReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPendingReplyReservationAdjuster implements PendingReplyReservationStep {
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

  adjust(item: PendingReplyReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending reply reservation steps in order and keeps a trace of each. */
export class PendingReplyReservationEngine {
  steps: PendingReplyReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingReplyReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingReplyReservation): number {
    let current = item.netExposure();
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

  evaluateAll(items: PendingReplyReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingReplyReservationEngine(flagsValue: flags.Registry): PendingReplyReservationEngine {
  return new PendingReplyReservationEngine(
    [
      new RoundingPendingReplyReservationAdjuster(5),
      new TieredPendingReplyReservationAdjuster([1280, 9587], [1.17, 0.88]),
      new FlaggedPendingReplyReservationAdjuster(flagsValue, "pending-reply-reservation-strict", -5),
    ],
    [],
    2.8,
    51780.1,
  );
}
