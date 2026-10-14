import * as numbers from "../../../../kit/numbers.js";
import { ManualStepRecord } from "./manual-step-record.js";

/** One step of the manual step record calculation. */
export interface ManualStepRecordFactor {
  describe(): string;
  adjust(item: ManualStepRecord, value: number): number;
}

export class ManualStepRecordMinimumOffsetAdjuster implements ManualStepRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ManualStepRecord, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class RoundingManualStepRecordAdjuster implements ManualStepRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualStepRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumManualStepRecordAdjuster implements ManualStepRecordFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualStepRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual step record steps in order and keeps a trace of each. */
export class ManualStepRecordEngine {
  steps: ManualStepRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualStepRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualStepRecord): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ManualStepRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualStepRecordEngine(): ManualStepRecordEngine {
  return new ManualStepRecordEngine(
    [
      new ManualStepRecordMinimumOffsetAdjuster(0.49),
      new RoundingManualStepRecordAdjuster(5),
      new MinimumManualStepRecordAdjuster(27.8),
    ],
    [],
    3.7,
    84572.3,
  );
}
