import { RetentionRecord } from "./retention-record.js";

/** One step of the retention record calculation. */
export interface RetentionRecordAdjuster {
  describe(): string;
  adjust(item: RetentionRecord, value: number): number;
}

export class CapRetentionRecordAdjuster implements RetentionRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRetentionRecordAdjuster implements RetentionRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRetentionRecordAdjuster implements RetentionRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention record steps in order and keeps a trace of each. */
export class RetentionRecordEngine {
  steps: RetentionRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RetentionRecord): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RetentionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRetentionRecordEngine(): RetentionRecordEngine {
  return new RetentionRecordEngine(
    [
      new CapRetentionRecordAdjuster(49505),
      new MinimumRetentionRecordAdjuster(35.9),
      new PercentRetentionRecordAdjuster(3.4),
    ],
    [],
    4,
    81491.8,
  );
}
