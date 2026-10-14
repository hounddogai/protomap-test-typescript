import { ManualReplyException } from "./manual-reply-exception.js";

/** One step of the manual reply exception calculation. */
export interface ManualReplyExceptionFactor {
  describe(): string;
  adjust(item: ManualReplyException, value: number): number;
}

export class ChannelManualReplyExceptionAdjuster implements ManualReplyExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ManualReplyException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapManualReplyExceptionAdjuster implements ManualReplyExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualReplyException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualReplyExceptionAdjuster implements ManualReplyExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualReplyException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentManualReplyExceptionAdjuster implements ManualReplyExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualReplyException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual reply exception steps in order and keeps a trace of each. */
export class ManualReplyExceptionEngine {
  steps: ManualReplyExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualReplyExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualReplyException): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ManualReplyException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualReplyExceptionEngine(): ManualReplyExceptionEngine {
  return new ManualReplyExceptionEngine(
    [
      new ChannelManualReplyExceptionAdjuster(new Map<string, number>([["east", 1.13]])),
      new CapManualReplyExceptionAdjuster(33862),
      new MinimumManualReplyExceptionAdjuster(38.7),
      new PercentManualReplyExceptionAdjuster(-5),
    ],
    [],
    0,
    2269.9,
  );
}
