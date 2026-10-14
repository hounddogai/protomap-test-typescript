import * as flags from "../../../../kit/flags.js";
import { PrimaryInsightReservation } from "./primary-insight-reservation.js";

/** One step of the primary insight reservation calculation. */
export interface PrimaryInsightReservationModifier {
  describe(): string;
  adjust(item: PrimaryInsightReservation, value: number): number;
}

export class MinimumPrimaryInsightReservationAdjuster implements PrimaryInsightReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryInsightReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPrimaryInsightReservationAdjuster implements PrimaryInsightReservationModifier {
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

  adjust(item: PrimaryInsightReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryInsightReservationImpressionsOffsetAdjuster implements PrimaryInsightReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PrimaryInsightReservation, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the primary insight reservation steps in order and keeps a trace of each. */
export class PrimaryInsightReservationEngine {
  steps: PrimaryInsightReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInsightReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryInsightReservation): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PrimaryInsightReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryInsightReservationEngine(flagsValue: flags.Registry): PrimaryInsightReservationEngine {
  return new PrimaryInsightReservationEngine(
    [
      new MinimumPrimaryInsightReservationAdjuster(0.5),
      new FlaggedPrimaryInsightReservationAdjuster(flagsValue, "primary-insight-reservation-seasonal", 0.7),
      new PrimaryInsightReservationImpressionsOffsetAdjuster(0.83),
    ],
    [],
    4.1,
    74200.1,
  );
}
