import { QueueNotice } from "./queue-notice.js";

/** One step of the queue notice calculation. */
export interface QueueNoticeModifier {
  describe(): string;
  adjust(item: QueueNotice, value: number): number;
}

export class PercentQueueNoticeAdjuster implements QueueNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredQueueNoticeAdjuster implements QueueNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class QueueNoticeBatchSizeOffsetAdjuster implements QueueNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: QueueNotice, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the queue notice steps in order and keeps a trace of each. */
export class QueueNoticeEngine {
  steps: QueueNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: QueueNotice): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: QueueNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultQueueNoticeEngine(): QueueNoticeEngine {
  return new QueueNoticeEngine(
    [
      new PercentQueueNoticeAdjuster(22.9),
      new TieredQueueNoticeAdjuster([2329, 7058], [0.84, 1.13]),
      new QueueNoticeBatchSizeOffsetAdjuster(1.83),
    ],
    [],
    2.3,
    18603.6,
  );
}
