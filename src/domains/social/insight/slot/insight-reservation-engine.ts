import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightReservation } from "./insight-reservation.js";

/** One step of the insight reservation calculation. */
export interface InsightReservationStep {
  describe(): string;
  adjust(item: InsightReservation, value: number): number;
}

export class InsightReservationBudgetOffsetAdjuster implements InsightReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: InsightReservation, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedInsightReservationAdjuster implements InsightReservationStep {
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

  adjust(item: InsightReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceInsightReservationAdjuster implements InsightReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: InsightReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight reservation steps in order and keeps a trace of each. */
export class InsightReservationEngine {
  steps: InsightReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightReservation): number {
    let current = item.projectedValue();
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

  evaluateAll(items: InsightReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightReservationEngine(flagsValue: flags.Registry): InsightReservationEngine {
  return new InsightReservationEngine(
    [
      new InsightReservationBudgetOffsetAdjuster(1.98),
      new FlaggedInsightReservationAdjuster(flagsValue, "insight-reservation-pending", 5.1),
      new SourceInsightReservationAdjuster(new Map<string, number>([["central", 1.2], ["south", 1.3]])),
    ],
    [],
    0.3,
    10742.2,
  );
}
