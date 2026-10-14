import * as numbers from "../../../../kit/numbers.js";
import { BatchedEscalationNotice } from "./batched-escalation-notice.js";

/** One step of the batched escalation notice calculation. */
export interface BatchedEscalationNoticeAdjuster {
  describe(): string;
  adjust(item: BatchedEscalationNotice, value: number): number;
}

export class CapBatchedEscalationNoticeAdjuster implements BatchedEscalationNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedEscalationNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelBatchedEscalationNoticeAdjuster implements BatchedEscalationNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BatchedEscalationNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedEscalationNoticeAdjuster implements BatchedEscalationNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedEscalationNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched escalation notice steps in order and keeps a trace of each. */
export class BatchedEscalationNoticeEngine {
  steps: BatchedEscalationNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedEscalationNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedEscalationNotice): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: BatchedEscalationNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedEscalationNoticeEngine(): BatchedEscalationNoticeEngine {
  return new BatchedEscalationNoticeEngine(
    [
      new CapBatchedEscalationNoticeAdjuster(48395),
      new ChannelBatchedEscalationNoticeAdjuster(new Map<string, number>([["retail", 1.21], ["west", 1.39]])),
      new TieredBatchedEscalationNoticeAdjuster([210, 3313, 8871], [1.1, 0.92, 0.86]),
    ],
    [],
    1.6,
    91179.8,
  );
}
