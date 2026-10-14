import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortBatch } from "./cohort-batch.js";

/** One step of the cohort batch calculation. */
export interface CohortBatchAdjuster {
  describe(): string;
  adjust(item: CohortBatch, value: number): number;
}

export class RoundingCohortBatchAdjuster implements CohortBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCohortBatchAdjuster implements CohortBatchAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCohortBatchAdjuster implements CohortBatchAdjuster {
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

  adjust(item: CohortBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the cohort batch steps in order and keeps a trace of each. */
export class CohortBatchEngine {
  steps: CohortBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CohortBatch): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CohortBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCohortBatchEngine(flagsValue: flags.Registry): CohortBatchEngine {
  return new CohortBatchEngine(
    [
      new RoundingCohortBatchAdjuster(1),
      new MinimumCohortBatchAdjuster(9.6),
      new FlaggedCohortBatchAdjuster(flagsValue, "cohort-batch-lenient", 7.5),
    ],
    [],
    2.7,
    10110.2,
  );
}
