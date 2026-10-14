import * as numbers from "../../../../kit/numbers.js";
import { WeightedPacingSchedule } from "./weighted-pacing-schedule.js";

/** One step of the weighted pacing schedule calculation. */
export interface WeightedPacingScheduleFactor {
  describe(): string;
  adjust(item: WeightedPacingSchedule, value: number): number;
}

export class RoundingWeightedPacingScheduleAdjuster implements WeightedPacingScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedPacingSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameWeightedPacingScheduleAdjuster implements WeightedPacingScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WeightedPacingSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWeightedPacingScheduleAdjuster implements WeightedPacingScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedPacingSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWeightedPacingScheduleAdjuster implements WeightedPacingScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPacingSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedPacingScheduleScoreOffsetAdjuster implements WeightedPacingScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: WeightedPacingSchedule, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the weighted pacing schedule steps in order and keeps a trace of each. */
export class WeightedPacingScheduleEngine {
  steps: WeightedPacingScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPacingScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedPacingSchedule): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: WeightedPacingSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedPacingScheduleEngine(): WeightedPacingScheduleEngine {
  return new WeightedPacingScheduleEngine(
    [
      new RoundingWeightedPacingScheduleAdjuster(0.25),
      new NameWeightedPacingScheduleAdjuster(new Map<string, number>([["west", 0.75], ["online", 0.86]])),
      new TieredWeightedPacingScheduleAdjuster([1080, 4351, 6241], [0.99, 0.86, 0.96]),
      new MinimumWeightedPacingScheduleAdjuster(22.4),
      new WeightedPacingScheduleScoreOffsetAdjuster(1.56),
    ],
    [],
    3.7,
    21215.3,
  );
}
