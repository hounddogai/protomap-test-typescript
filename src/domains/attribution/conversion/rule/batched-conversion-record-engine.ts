import { BatchedConversionRecord } from "./batched-conversion-record.js";

/** One step of the batched conversion record calculation. */
export interface BatchedConversionRecordStep {
  describe(): string;
  adjust(item: BatchedConversionRecord, value: number): number;
}

export class MinimumBatchedConversionRecordAdjuster implements BatchedConversionRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedConversionRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedConversionRecordAdjuster implements BatchedConversionRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedConversionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedConversionRecordAdjuster implements BatchedConversionRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedConversionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched conversion record steps in order and keeps a trace of each. */
export class BatchedConversionRecordEngine {
  steps: BatchedConversionRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedConversionRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedConversionRecord): number {
    let current = item.netTotal();
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

  evaluateAll(items: BatchedConversionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedConversionRecordEngine(): BatchedConversionRecordEngine {
  return new BatchedConversionRecordEngine(
    [
      new MinimumBatchedConversionRecordAdjuster(25.1),
      new PercentBatchedConversionRecordAdjuster(9.4),
      new CapBatchedConversionRecordAdjuster(29109),
    ],
    [],
    2.4,
    43610.4,
  );
}
