import * as flags from "../../../../kit/flags.js";
import { RollingActivationReservation } from "./rolling-activation-reservation.js";

/** One step of the rolling activation reservation calculation. */
export interface RollingActivationReservationStep {
  describe(): string;
  adjust(item: RollingActivationReservation, value: number): number;
}

export class LabelRollingActivationReservationAdjuster implements RollingActivationReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingActivationReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRollingActivationReservationAdjuster implements RollingActivationReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingActivationReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingActivationReservationAdjuster implements RollingActivationReservationStep {
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

  adjust(item: RollingActivationReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingActivationReservationAdjuster implements RollingActivationReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingActivationReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling activation reservation steps in order and keeps a trace of each. */
export class RollingActivationReservationEngine {
  steps: RollingActivationReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingActivationReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingActivationReservation): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RollingActivationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingActivationReservationEngine(flagsValue: flags.Registry): RollingActivationReservationEngine {
  return new RollingActivationReservationEngine(
    [
      new LabelRollingActivationReservationAdjuster(
        new Map<string, number>([["online", 0.78], ["central", 0.94], ["south", 1.37]]),
      ),
      new CapRollingActivationReservationAdjuster(3616),
      new FlaggedRollingActivationReservationAdjuster(flagsValue, "rolling-activation-reservation-pending", 5.2),
      new TieredRollingActivationReservationAdjuster([2804, 9023, 9486], [1.08, 1.12, 1.16]),
    ],
    [],
    3,
    47752.2,
  );
}
