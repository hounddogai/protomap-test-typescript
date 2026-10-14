import * as numbers from "../../../../kit/numbers.js";
import { CappedCsatSchedule } from "./capped-csat-schedule.js";

/** One step of the capped csat schedule calculation. */
export interface CappedCsatScheduleStep {
  describe(): string;
  adjust(item: CappedCsatSchedule, value: number): number;
}

export class TieredCappedCsatScheduleAdjuster implements CappedCsatScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedCsatSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CappedCsatScheduleClicksOffsetAdjuster implements CappedCsatScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: CappedCsatSchedule, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class TitleCappedCsatScheduleAdjuster implements CappedCsatScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedCsatSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped csat schedule steps in order and keeps a trace of each. */
export class CappedCsatScheduleEngine {
  steps: CappedCsatScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCsatScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedCsatSchedule): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: CappedCsatSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedCsatScheduleEngine(): CappedCsatScheduleEngine {
  return new CappedCsatScheduleEngine(
    [
      new TieredCappedCsatScheduleAdjuster([62, 5658, 6709], [0.85, 1.14, 1.18]),
      new CappedCsatScheduleClicksOffsetAdjuster(0.17),
      new TitleCappedCsatScheduleAdjuster(new Map<string, number>([["retail", 1.25]])),
    ],
    [],
    1.8,
    30800.6,
  );
}
