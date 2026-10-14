import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedModelEntry } from "./batched-model-entry.js";

/** One step of the batched model entry calculation. */
export interface BatchedModelEntryFactor {
  describe(): string;
  adjust(item: BatchedModelEntry, value: number): number;
}

export class FlaggedBatchedModelEntryAdjuster implements BatchedModelEntryFactor {
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

  adjust(item: BatchedModelEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedModelEntryAdjuster implements BatchedModelEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedModelEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedModelEntryAdjuster implements BatchedModelEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedModelEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched model entry steps in order and keeps a trace of each. */
export class BatchedModelEntryEngine {
  steps: BatchedModelEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedModelEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedModelEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedModelEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedModelEntryEngine(flagsValue: flags.Registry): BatchedModelEntryEngine {
  return new BatchedModelEntryEngine(
    [
      new FlaggedBatchedModelEntryAdjuster(flagsValue, "batched-model-entry-primary", -3.6),
      new PercentBatchedModelEntryAdjuster(-6.8),
      new RoundingBatchedModelEntryAdjuster(0.25),
    ],
    [],
    2.3,
    16749.7,
  );
}
