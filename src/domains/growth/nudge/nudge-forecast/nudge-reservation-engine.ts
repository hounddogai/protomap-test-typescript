import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeReservation } from "./nudge-reservation.js";

/** One step of the nudge reservation calculation. */
export interface NudgeReservationFactor {
  describe(): string;
  adjust(item: NudgeReservation, value: number): number;
}

export class TieredNudgeReservationAdjuster implements NudgeReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleNudgeReservationAdjuster implements NudgeReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: NudgeReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class NudgeReservationConversionRateOffsetAdjuster implements NudgeReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: NudgeReservation, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class FlaggedNudgeReservationAdjuster implements NudgeReservationFactor {
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

  adjust(item: NudgeReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentNudgeReservationAdjuster implements NudgeReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingNudgeReservationAdjuster implements NudgeReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the nudge reservation steps in order and keeps a trace of each. */
export class NudgeReservationEngine {
  steps: NudgeReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: NudgeReservation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: NudgeReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultNudgeReservationEngine(flagsValue: flags.Registry): NudgeReservationEngine {
  return new NudgeReservationEngine(
    [
      new TieredNudgeReservationAdjuster([1331, 8936, 9035], [1.2, 1.16, 0.99]),
      new LocaleNudgeReservationAdjuster(new Map<string, number>([["west", 1.33]])),
      new NudgeReservationConversionRateOffsetAdjuster(1.65),
      new FlaggedNudgeReservationAdjuster(flagsValue, "nudge-reservation-scheduled", 1.1),
      new PercentNudgeReservationAdjuster(-17.9),
      new RoundingNudgeReservationAdjuster(0.5),
    ],
    [],
    0.3,
    50040,
  );
}
