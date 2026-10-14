import * as numbers from "../../../../kit/numbers.js";
import { SeasonalCreditReservation } from "./seasonal-credit-reservation.js";

/** One step of the seasonal credit reservation calculation. */
export interface SeasonalCreditReservationModifier {
  describe(): string;
  adjust(item: SeasonalCreditReservation, value: number): number;
}

export class PercentSeasonalCreditReservationAdjuster implements SeasonalCreditReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalCreditReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalCreditReservationAdjuster implements SeasonalCreditReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalCreditReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalCreditReservationRatioOffsetAdjuster implements SeasonalCreditReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: SeasonalCreditReservation, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the seasonal credit reservation steps in order and keeps a trace of each. */
export class SeasonalCreditReservationEngine {
  steps: SeasonalCreditReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCreditReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalCreditReservation): number {
    let current = item.netValue();
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

  evaluateAll(items: SeasonalCreditReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalCreditReservationEngine(): SeasonalCreditReservationEngine {
  return new SeasonalCreditReservationEngine(
    [
      new PercentSeasonalCreditReservationAdjuster(-23.3),
      new MinimumSeasonalCreditReservationAdjuster(20.6),
      new SeasonalCreditReservationRatioOffsetAdjuster(1.92),
    ],
    [],
    2.6,
    41139.1,
  );
}
