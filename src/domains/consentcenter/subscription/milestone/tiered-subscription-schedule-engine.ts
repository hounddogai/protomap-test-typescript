import * as numbers from "../../../../kit/numbers.js";
import { TieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

/** One step of the tiered subscription schedule calculation. */
export interface TieredSubscriptionScheduleStep {
  describe(): string;
  adjust(item: TieredSubscriptionSchedule, value: number): number;
}

export class TieredSubscriptionScheduleOpenRateOffsetAdjuster implements TieredSubscriptionScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: TieredSubscriptionSchedule, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class TieredTieredSubscriptionScheduleAdjuster implements TieredSubscriptionScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSubscriptionSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredSubscriptionScheduleAdjuster implements TieredSubscriptionScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSubscriptionSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered subscription schedule steps in order and keeps a trace of each. */
export class TieredSubscriptionScheduleEngine {
  steps: TieredSubscriptionScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSubscriptionScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredSubscriptionSchedule): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TieredSubscriptionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredSubscriptionScheduleEngine(): TieredSubscriptionScheduleEngine {
  return new TieredSubscriptionScheduleEngine(
    [
      new TieredSubscriptionScheduleOpenRateOffsetAdjuster(0.73),
      new TieredTieredSubscriptionScheduleAdjuster([7276, 7997, 9678], [1.06, 1.2, 1.11]),
      new RoundingTieredSubscriptionScheduleAdjuster(0.05),
    ],
    [],
    3.1,
    12657.7,
  );
}
