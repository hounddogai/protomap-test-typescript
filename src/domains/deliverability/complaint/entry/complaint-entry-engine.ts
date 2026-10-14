import { ComplaintEntry } from "./complaint-entry.js";

/** One step of the complaint entry calculation. */
export interface ComplaintEntryFactor {
  describe(): string;
  adjust(item: ComplaintEntry, value: number): number;
}

export class ComplaintEntryRetriesOffsetAdjuster implements ComplaintEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ComplaintEntry, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumComplaintEntryAdjuster implements ComplaintEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentComplaintEntryAdjuster implements ComplaintEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the complaint entry steps in order and keeps a trace of each. */
export class ComplaintEntryEngine {
  steps: ComplaintEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ComplaintEntry): number {
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

  evaluateAll(items: ComplaintEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultComplaintEntryEngine(): ComplaintEntryEngine {
  return new ComplaintEntryEngine(
    [
      new ComplaintEntryRetriesOffsetAdjuster(1.03),
      new MinimumComplaintEntryAdjuster(27.8),
      new PercentComplaintEntryAdjuster(3),
    ],
    [],
    1.7,
    84717.7,
  );
}
