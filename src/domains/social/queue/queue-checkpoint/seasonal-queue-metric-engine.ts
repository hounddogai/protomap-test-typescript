import * as numbers from "../../../../kit/numbers.js";
import { SeasonalQueueMetric } from "./seasonal-queue-metric.js";

/** One step of the seasonal queue metric calculation. */
export interface SeasonalQueueMetricModifier {
  describe(): string;
  adjust(item: SeasonalQueueMetric, value: number): number;
}

export class PercentSeasonalQueueMetricAdjuster implements SeasonalQueueMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalQueueMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalQueueMetricAdjuster implements SeasonalQueueMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalQueueMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSeasonalQueueMetricAdjuster implements SeasonalQueueMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalQueueMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentSeasonalQueueMetricAdjuster implements SeasonalQueueMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SeasonalQueueMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSeasonalQueueMetricAdjuster implements SeasonalQueueMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalQueueMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal queue metric steps in order and keeps a trace of each. */
export class SeasonalQueueMetricEngine {
  steps: SeasonalQueueMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalQueueMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalQueueMetric): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalQueueMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalQueueMetricEngine(): SeasonalQueueMetricEngine {
  return new SeasonalQueueMetricEngine(
    [
      new PercentSeasonalQueueMetricAdjuster(6.4),
      new MinimumSeasonalQueueMetricAdjuster(28.8),
      new CapSeasonalQueueMetricAdjuster(40095),
      new SegmentSeasonalQueueMetricAdjuster(new Map<string, number>([["south", 0.77]])),
      new RoundingSeasonalQueueMetricAdjuster(1),
    ],
    [],
    2.2,
    26650.7,
  );
}
