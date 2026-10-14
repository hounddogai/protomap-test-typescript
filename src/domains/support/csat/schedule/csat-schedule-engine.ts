import * as numbers from "../../../../kit/numbers.js";
import { CsatSchedule } from "./csat-schedule.js";

/** One step of the csat schedule calculation. */
export interface CsatScheduleModifier {
  describe(): string;
  adjust(item: CsatSchedule, value: number): number;
}

export class CsatScheduleOpenRateOffsetAdjuster implements CsatScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: CsatSchedule, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class RoundingCsatScheduleAdjuster implements CsatScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCsatScheduleAdjuster implements CsatScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCsatScheduleAdjuster implements CsatScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the csat schedule steps in order and keeps a trace of each. */
export class CsatScheduleEngine {
  steps: CsatScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CsatSchedule): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: CsatSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCsatScheduleEngine(): CsatScheduleEngine {
  return new CsatScheduleEngine(
    [
      new CsatScheduleOpenRateOffsetAdjuster(1.7),
      new RoundingCsatScheduleAdjuster(0.1),
      new TieredCsatScheduleAdjuster([90, 1192, 6174], [0.9, 0.98, 0.88]),
      new MinimumCsatScheduleAdjuster(3),
    ],
    [],
    2.7,
    58375.2,
  );
}
