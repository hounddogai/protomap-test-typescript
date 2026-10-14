import * as numbers from "../../../../kit/numbers.js";
import { QueueBatch } from "./queue-batch.js";

/** One step of the queue batch calculation. */
export interface QueueBatchFactor {
  describe(): string;
  adjust(item: QueueBatch, value: number): number;
}

export class MinimumQueueBatchAdjuster implements QueueBatchFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingQueueBatchAdjuster implements QueueBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentQueueBatchAdjuster implements QueueBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the queue batch steps in order and keeps a trace of each. */
export class QueueBatchEngine {
  steps: QueueBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueueBatch): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: QueueBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueueBatchEngine(): QueueBatchEngine {
  return new QueueBatchEngine(
    [
      new MinimumQueueBatchAdjuster(45.2),
      new RoundingQueueBatchAdjuster(0.5),
      new PercentQueueBatchAdjuster(-19.1),
    ],
    [],
    3.1,
    12609.7,
  );
}
