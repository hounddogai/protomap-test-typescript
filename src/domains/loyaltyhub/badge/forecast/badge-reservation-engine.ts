import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeReservation } from "./badge-reservation.js";

/** One step of the badge reservation calculation. */
export interface BadgeReservationModifier {
  describe(): string;
  adjust(item: BadgeReservation, value: number): number;
}

export class BadgeReservationFloorValueOffsetAdjuster implements BadgeReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: BadgeReservation, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class FlaggedBadgeReservationAdjuster implements BadgeReservationModifier {
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

  adjust(item: BadgeReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBadgeReservationAdjuster implements BadgeReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBadgeReservationAdjuster implements BadgeReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBadgeReservationAdjuster implements BadgeReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelBadgeReservationAdjuster implements BadgeReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BadgeReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the badge reservation steps in order and keeps a trace of each. */
export class BadgeReservationEngine {
  steps: BadgeReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeReservation): number {
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

  evaluateAll(items: BadgeReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeReservationEngine(flagsValue: flags.Registry): BadgeReservationEngine {
  return new BadgeReservationEngine(
    [
      new BadgeReservationFloorValueOffsetAdjuster(1.48),
      new FlaggedBadgeReservationAdjuster(flagsValue, "badge-reservation-seasonal", -4.2),
      new MinimumBadgeReservationAdjuster(20.3),
      new TieredBadgeReservationAdjuster([1357, 1714, 2118, 2251], [1.19, 1.07, 1, 0.94]),
      new RoundingBadgeReservationAdjuster(0.5),
      new LabelBadgeReservationAdjuster(new Map<string, number>([["retail", 1.14], ["central", 1.03]])),
    ],
    [],
    2.3,
    71430.6,
  );
}
