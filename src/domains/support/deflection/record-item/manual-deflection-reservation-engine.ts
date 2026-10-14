import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualDeflectionReservation } from "./manual-deflection-reservation.js";

/** One step of the manual deflection reservation calculation. */
export interface ManualDeflectionReservationFactor {
  describe(): string;
  adjust(item: ManualDeflectionReservation, value: number): number;
}

export class MinimumManualDeflectionReservationAdjuster implements ManualDeflectionReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualDeflectionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualDeflectionReservationAdjuster implements ManualDeflectionReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualDeflectionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualDeflectionReservationAdjuster implements ManualDeflectionReservationFactor {
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

  adjust(item: ManualDeflectionReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentManualDeflectionReservationAdjuster implements ManualDeflectionReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualDeflectionReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleManualDeflectionReservationAdjuster implements ManualDeflectionReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualDeflectionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualDeflectionReservationMinimumOffsetAdjuster implements ManualDeflectionReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ManualDeflectionReservation, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the manual deflection reservation steps in order and keeps a trace of each. */
export class ManualDeflectionReservationEngine {
  steps: ManualDeflectionReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualDeflectionReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualDeflectionReservation): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ManualDeflectionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualDeflectionReservationEngine(flagsValue: flags.Registry): ManualDeflectionReservationEngine {
  return new ManualDeflectionReservationEngine(
    [
      new MinimumManualDeflectionReservationAdjuster(22.2),
      new RoundingManualDeflectionReservationAdjuster(0.5),
      new FlaggedManualDeflectionReservationAdjuster(flagsValue, "manual-deflection-reservation-legacy", 8.2),
      new PercentManualDeflectionReservationAdjuster(-16.7),
      new TitleManualDeflectionReservationAdjuster(new Map<string, number>([["east", 1.17]])),
      new ManualDeflectionReservationMinimumOffsetAdjuster(1.88),
    ],
    [],
    4.6,
    22550.8,
  );
}
