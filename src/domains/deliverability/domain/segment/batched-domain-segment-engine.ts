import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedDomainSegment } from "./batched-domain-segment.js";

/** One step of the batched domain segment calculation. */
export interface BatchedDomainSegmentModifier {
  describe(): string;
  adjust(item: BatchedDomainSegment, value: number): number;
}

export class TieredBatchedDomainSegmentAdjuster implements BatchedDomainSegmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedDomainSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedDomainSegmentAdjuster implements BatchedDomainSegmentModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedDomainSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedDomainSegmentAdjuster implements BatchedDomainSegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedDomainSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedDomainSegmentWindowDaysOffsetAdjuster implements BatchedDomainSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: BatchedDomainSegment, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the batched domain segment steps in order and keeps a trace of each. */
export class BatchedDomainSegmentEngine {
  steps: BatchedDomainSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedDomainSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedDomainSegment): number {
    let current = item.netValue();
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

  evaluateAll(items: BatchedDomainSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedDomainSegmentEngine(flagsValue: flags.Registry): BatchedDomainSegmentEngine {
  return new BatchedDomainSegmentEngine(
    [
      new TieredBatchedDomainSegmentAdjuster([1902, 2149, 7752], [0.89, 0.82, 0.85]),
      new FlaggedBatchedDomainSegmentAdjuster(flagsValue, "batched-domain-segment-scheduled", -6.9),
      new PercentBatchedDomainSegmentAdjuster(-18.3),
      new BatchedDomainSegmentWindowDaysOffsetAdjuster(0.15),
    ],
    [],
    4.8,
    74667.2,
  );
}
