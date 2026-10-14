import * as numbers from "../../../../kit/numbers.js";
import { QueueEstimate } from "./queue-estimate.js";

/** One step of the queue estimate calculation. */
export interface QueueEstimateModifier {
  describe(): string;
  adjust(item: QueueEstimate, value: number): number;
}

export class QueueEstimateExpiresAtOffsetAdjuster implements QueueEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: QueueEstimate, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumQueueEstimateAdjuster implements QueueEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingQueueEstimateAdjuster implements QueueEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentQueueEstimateAdjuster implements QueueEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceQueueEstimateAdjuster implements QueueEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: QueueEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the queue estimate steps in order and keeps a trace of each. */
export class QueueEstimateEngine {
  steps: QueueEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueueEstimate): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: QueueEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueueEstimateEngine(): QueueEstimateEngine {
  return new QueueEstimateEngine(
    [
      new QueueEstimateExpiresAtOffsetAdjuster(1.21),
      new MinimumQueueEstimateAdjuster(33.3),
      new RoundingQueueEstimateAdjuster(0.05),
      new PercentQueueEstimateAdjuster(20.3),
      new SourceQueueEstimateAdjuster(new Map<string, number>([["retail", 0.81], ["central", 1.21]])),
    ],
    [],
    0.1,
    80735.1,
  );
}
