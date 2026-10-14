import * as numbers from "../../../../kit/numbers.js";
import { PlacementMetric } from "./placement-metric.js";

/** One step of the placement metric calculation. */
export interface PlacementMetricStep {
  describe(): string;
  adjust(item: PlacementMetric, value: number): number;
}

export class TieredPlacementMetricAdjuster implements PlacementMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPlacementMetricAdjuster implements PlacementMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPlacementMetricAdjuster implements PlacementMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement metric steps in order and keeps a trace of each. */
export class PlacementMetricEngine {
  steps: PlacementMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementMetric): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: PlacementMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementMetricEngine(): PlacementMetricEngine {
  return new PlacementMetricEngine(
    [
      new TieredPlacementMetricAdjuster([3370, 8638, 9018], [1.04, 1.09, 1.13]),
      new RoundingPlacementMetricAdjuster(5),
      new PercentPlacementMetricAdjuster(7.6),
    ],
    [],
    2.8,
    26041.9,
  );
}
