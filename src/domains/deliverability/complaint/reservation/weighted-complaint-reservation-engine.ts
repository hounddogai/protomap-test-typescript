import * as flags from "../../../../kit/flags.js";
import { WeightedComplaintReservation } from "./weighted-complaint-reservation.js";

/** One step of the weighted complaint reservation calculation. */
export interface WeightedComplaintReservationAdjuster {
  describe(): string;
  adjust(item: WeightedComplaintReservation, value: number): number;
}

export class TieredWeightedComplaintReservationAdjuster implements WeightedComplaintReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedComplaintReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWeightedComplaintReservationAdjuster implements WeightedComplaintReservationAdjuster {
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

  adjust(item: WeightedComplaintReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedComplaintReservationAdjuster implements WeightedComplaintReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedComplaintReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelWeightedComplaintReservationAdjuster implements WeightedComplaintReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedComplaintReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted complaint reservation steps in order and keeps a trace of each. */
export class WeightedComplaintReservationEngine {
  steps: WeightedComplaintReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedComplaintReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedComplaintReservation): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: WeightedComplaintReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedComplaintReservationEngine(flagsValue: flags.Registry): WeightedComplaintReservationEngine {
  return new WeightedComplaintReservationEngine(
    [
      new TieredWeightedComplaintReservationAdjuster([8359, 8511], [0.81, 1.2]),
      new FlaggedWeightedComplaintReservationAdjuster(
        flagsValue,
        "weighted-complaint-reservation-fallback",
        4.6,
      ),
      new CapWeightedComplaintReservationAdjuster(35301),
      new ChannelWeightedComplaintReservationAdjuster(
        new Map<string, number>([["retail", 0.86], ["central", 1.13], ["online", 0.82]]),
      ),
    ],
    [],
    0.6,
    46568.1,
  );
}
