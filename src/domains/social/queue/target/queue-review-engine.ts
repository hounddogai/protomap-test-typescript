import * as numbers from "../../../../kit/numbers.js";
import { QueueReview } from "./queue-review.js";

/** One step of the queue review calculation. */
export interface QueueReviewAdjuster {
  describe(): string;
  adjust(item: QueueReview, value: number): number;
}

export class QueueReviewDurationMinutesOffsetAdjuster implements QueueReviewAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: QueueReview, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumQueueReviewAdjuster implements QueueReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingQueueReviewAdjuster implements QueueReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleQueueReviewAdjuster implements QueueReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: QueueReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the queue review steps in order and keeps a trace of each. */
export class QueueReviewEngine {
  steps: QueueReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: QueueReview): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: QueueReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultQueueReviewEngine(): QueueReviewEngine {
  return new QueueReviewEngine(
    [
      new QueueReviewDurationMinutesOffsetAdjuster(1.23),
      new MinimumQueueReviewAdjuster(31.8),
      new RoundingQueueReviewAdjuster(0.5),
      new TitleQueueReviewAdjuster(new Map<string, number>([["south", 1.3], ["east", 0.98]])),
    ],
    [],
    2.6,
    27185.7,
  );
}
