import * as numbers from "../../../../kit/numbers.js";
import { QueueRequest } from "./queue-request.js";

/** One step of the queue request calculation. */
export interface QueueRequestStep {
  describe(): string;
  adjust(item: QueueRequest, value: number): number;
}

export class RoundingQueueRequestAdjuster implements QueueRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentQueueRequestAdjuster implements QueueRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameQueueRequestAdjuster implements QueueRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: QueueRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class QueueRequestMinimumOffsetAdjuster implements QueueRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: QueueRequest, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the queue request steps in order and keeps a trace of each. */
export class QueueRequestEngine {
  steps: QueueRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: QueueRequest): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: QueueRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultQueueRequestEngine(): QueueRequestEngine {
  return new QueueRequestEngine(
    [
      new RoundingQueueRequestAdjuster(0.1),
      new PercentQueueRequestAdjuster(-8.7),
      new NameQueueRequestAdjuster(new Map<string, number>([["online", 0.85], ["east", 1.24], ["north", 1.12]])),
      new QueueRequestMinimumOffsetAdjuster(1.51),
    ],
    [],
    2.7,
    60877.7,
  );
}
