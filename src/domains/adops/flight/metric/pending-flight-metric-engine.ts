import * as numbers from "../../../../kit/numbers.js";
import { PendingFlightMetric } from "./pending-flight-metric.js";

/** One step of the pending flight metric calculation. */
export interface PendingFlightMetricAdjuster {
  describe(): string;
  adjust(item: PendingFlightMetric, value: number): number;
}

export class PendingFlightMetricCeilingOffsetAdjuster implements PendingFlightMetricAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingFlightMetric, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingPendingFlightMetricAdjuster implements PendingFlightMetricAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingFlightMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocalePendingFlightMetricAdjuster implements PendingFlightMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingFlightMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending flight metric steps in order and keeps a trace of each. */
export class PendingFlightMetricEngine {
  steps: PendingFlightMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingFlightMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingFlightMetric): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PendingFlightMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingFlightMetricEngine(): PendingFlightMetricEngine {
  return new PendingFlightMetricEngine(
    [
      new PendingFlightMetricCeilingOffsetAdjuster(1.71),
      new RoundingPendingFlightMetricAdjuster(0.05),
      new LocalePendingFlightMetricAdjuster(
        new Map<string, number>([["central", 0.76], ["west", 0.76], ["online", 1.16]]),
      ),
    ],
    [],
    2.2,
    82015.7,
  );
}
