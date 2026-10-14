import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

/** One step of the adaptive journey batch calculation. */
export interface AdaptiveJourneyBatchFactor {
  describe(): string;
  adjust(item: AdaptiveJourneyBatch, value: number): number;
}

export class TitleAdaptiveJourneyBatchAdjuster implements AdaptiveJourneyBatchFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: AdaptiveJourneyBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveJourneyBatchDurationMinutesOffsetAdjuster implements AdaptiveJourneyBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: AdaptiveJourneyBatch, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class RoundingAdaptiveJourneyBatchAdjuster implements AdaptiveJourneyBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveJourneyBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentAdaptiveJourneyBatchAdjuster implements AdaptiveJourneyBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveJourneyBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive journey batch steps in order and keeps a trace of each. */
export class AdaptiveJourneyBatchEngine {
  steps: AdaptiveJourneyBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveJourneyBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveJourneyBatch): number {
    let current = item.weightedValue();
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

  evaluateAll(items: AdaptiveJourneyBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveJourneyBatchEngine(): AdaptiveJourneyBatchEngine {
  return new AdaptiveJourneyBatchEngine(
    [
      new TitleAdaptiveJourneyBatchAdjuster(new Map<string, number>([["east", 1.25]])),
      new AdaptiveJourneyBatchDurationMinutesOffsetAdjuster(1.72),
      new RoundingAdaptiveJourneyBatchAdjuster(1),
      new PercentAdaptiveJourneyBatchAdjuster(-24.7),
    ],
    [],
    3.6,
    76615.3,
  );
}
