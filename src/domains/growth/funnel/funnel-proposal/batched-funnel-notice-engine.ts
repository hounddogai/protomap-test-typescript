import * as numbers from "../../../../kit/numbers.js";
import { BatchedFunnelNotice } from "./batched-funnel-notice.js";

/** One step of the batched funnel notice calculation. */
export interface BatchedFunnelNoticeModifier {
  describe(): string;
  adjust(item: BatchedFunnelNotice, value: number): number;
}

export class TieredBatchedFunnelNoticeAdjuster implements BatchedFunnelNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedFunnelNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelBatchedFunnelNoticeAdjuster implements BatchedFunnelNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedFunnelNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBatchedFunnelNoticeAdjuster implements BatchedFunnelNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedFunnelNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedFunnelNoticeAdjuster implements BatchedFunnelNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFunnelNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedFunnelNoticeOpenRateOffsetAdjuster implements BatchedFunnelNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: BatchedFunnelNotice, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class RoundingBatchedFunnelNoticeAdjuster implements BatchedFunnelNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFunnelNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched funnel notice steps in order and keeps a trace of each. */
export class BatchedFunnelNoticeEngine {
  steps: BatchedFunnelNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFunnelNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedFunnelNotice): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedFunnelNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedFunnelNoticeEngine(): BatchedFunnelNoticeEngine {
  return new BatchedFunnelNoticeEngine(
    [
      new TieredBatchedFunnelNoticeAdjuster([3256, 6232], [1.17, 1.12]),
      new LabelBatchedFunnelNoticeAdjuster(new Map<string, number>([["online", 1.26], ["east", 1.25]])),
      new CapBatchedFunnelNoticeAdjuster(36857),
      new PercentBatchedFunnelNoticeAdjuster(-15.8),
      new BatchedFunnelNoticeOpenRateOffsetAdjuster(1.18),
      new RoundingBatchedFunnelNoticeAdjuster(5),
    ],
    [],
    4.7,
    8084.6,
  );
}
