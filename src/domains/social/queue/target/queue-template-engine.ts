import * as numbers from "../../../../kit/numbers.js";
import { QueueTemplate } from "./queue-template.js";

/** One step of the queue template calculation. */
export interface QueueTemplateStep {
  describe(): string;
  adjust(item: QueueTemplate, value: number): number;
}

export class TieredQueueTemplateAdjuster implements QueueTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapQueueTemplateAdjuster implements QueueTemplateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class QueueTemplateEndsAtOffsetAdjuster implements QueueTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: QueueTemplate, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the queue template steps in order and keeps a trace of each. */
export class QueueTemplateEngine {
  steps: QueueTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: QueueTemplate): number {
    let current = item.netTotal();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: QueueTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultQueueTemplateEngine(): QueueTemplateEngine {
  return new QueueTemplateEngine(
    [
      new TieredQueueTemplateAdjuster([1560, 2031, 3956, 9886], [1, 1.18, 0.93, 1.04]),
      new CapQueueTemplateAdjuster(30795),
      new QueueTemplateEndsAtOffsetAdjuster(1.91),
    ],
    [],
    2.3,
    31373.6,
  );
}
