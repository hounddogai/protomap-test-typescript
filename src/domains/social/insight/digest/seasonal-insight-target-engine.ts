import { SeasonalInsightTarget } from "./seasonal-insight-target.js";

/** One step of the seasonal insight target calculation. */
export interface SeasonalInsightTargetFactor {
  describe(): string;
  adjust(item: SeasonalInsightTarget, value: number): number;
}

export class CapSeasonalInsightTargetAdjuster implements SeasonalInsightTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalInsightTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalInsightTargetAdjuster implements SeasonalInsightTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalInsightTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalInsightTargetQuantityOffsetAdjuster implements SeasonalInsightTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: SeasonalInsightTarget, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the seasonal insight target steps in order and keeps a trace of each. */
export class SeasonalInsightTargetEngine {
  steps: SeasonalInsightTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalInsightTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalInsightTarget): number {
    let current = item.netValue();
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

  evaluateAll(items: SeasonalInsightTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalInsightTargetEngine(): SeasonalInsightTargetEngine {
  return new SeasonalInsightTargetEngine(
    [
      new CapSeasonalInsightTargetAdjuster(32788),
      new MinimumSeasonalInsightTargetAdjuster(5.9),
      new SeasonalInsightTargetQuantityOffsetAdjuster(1.32),
    ],
    [],
    3.1,
    74765.2,
  );
}
