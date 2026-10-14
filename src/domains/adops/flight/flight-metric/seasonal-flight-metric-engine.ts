import { SeasonalFlightMetric } from "./seasonal-flight-metric.js";

/** One step of the seasonal flight metric calculation. */
export interface SeasonalFlightMetricModifier {
  describe(): string;
  adjust(item: SeasonalFlightMetric, value: number): number;
}

export class PercentSeasonalFlightMetricAdjuster implements SeasonalFlightMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalFlightMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalFlightMetricAdjuster implements SeasonalFlightMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalFlightMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalFlightMetricUpdatedAtOffsetAdjuster implements SeasonalFlightMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: SeasonalFlightMetric, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the seasonal flight metric steps in order and keeps a trace of each. */
export class SeasonalFlightMetricEngine {
  steps: SeasonalFlightMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalFlightMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalFlightMetric): number {
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

  evaluateAll(items: SeasonalFlightMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalFlightMetricEngine(): SeasonalFlightMetricEngine {
  return new SeasonalFlightMetricEngine(
    [
      new PercentSeasonalFlightMetricAdjuster(1.8),
      new CapSeasonalFlightMetricAdjuster(18768),
      new SeasonalFlightMetricUpdatedAtOffsetAdjuster(0.15),
    ],
    [],
    4.2,
    94221,
  );
}
