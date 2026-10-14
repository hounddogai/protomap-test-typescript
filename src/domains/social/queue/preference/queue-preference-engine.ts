import * as numbers from "../../../../kit/numbers.js";
import { QueuePreference } from "./queue-preference.js";

/** One step of the queue preference calculation. */
export interface QueuePreferenceStep {
  describe(): string;
  adjust(item: QueuePreference, value: number): number;
}

export class MinimumQueuePreferenceAdjuster implements QueuePreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueuePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingQueuePreferenceAdjuster implements QueuePreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueuePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentQueuePreferenceAdjuster implements QueuePreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueuePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the queue preference steps in order and keeps a trace of each. */
export class QueuePreferenceEngine {
  steps: QueuePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueuePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueuePreference): number {
    let current = item.weightedValue();
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

  evaluateAll(items: QueuePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueuePreferenceEngine(): QueuePreferenceEngine {
  return new QueuePreferenceEngine(
    [
      new MinimumQueuePreferenceAdjuster(49),
      new RoundingQueuePreferenceAdjuster(0.25),
      new PercentQueuePreferenceAdjuster(22.8),
    ],
    [],
    0.8,
    39268.3,
  );
}
