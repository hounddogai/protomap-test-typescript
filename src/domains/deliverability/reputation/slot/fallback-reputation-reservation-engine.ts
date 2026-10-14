import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackReputationReservation } from "./fallback-reputation-reservation.js";

/** One step of the fallback reputation reservation calculation. */
export interface FallbackReputationReservationFactor {
  describe(): string;
  adjust(item: FallbackReputationReservation, value: number): number;
}

export class MinimumFallbackReputationReservationAdjuster implements FallbackReputationReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackReputationReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackReputationReservationAdjuster implements FallbackReputationReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackReputationReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackReputationReservationFrequencyCapOffsetAdjuster implements FallbackReputationReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: FallbackReputationReservation, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class FlaggedFallbackReputationReservationAdjuster implements FallbackReputationReservationFactor {
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

  adjust(item: FallbackReputationReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback reputation reservation steps in order and keeps a trace of each. */
export class FallbackReputationReservationEngine {
  steps: FallbackReputationReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackReputationReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackReputationReservation): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: FallbackReputationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackReputationReservationEngine(flagsValue: flags.Registry): FallbackReputationReservationEngine {
  return new FallbackReputationReservationEngine(
    [
      new MinimumFallbackReputationReservationAdjuster(23.3),
      new RoundingFallbackReputationReservationAdjuster(1),
      new FallbackReputationReservationFrequencyCapOffsetAdjuster(1.19),
      new FlaggedFallbackReputationReservationAdjuster(
        flagsValue,
        "fallback-reputation-reservation-lenient",
        -5.4,
      ),
    ],
    [],
    3.3,
    77079.1,
  );
}
