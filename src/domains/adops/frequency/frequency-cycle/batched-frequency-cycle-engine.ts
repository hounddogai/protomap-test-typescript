import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFrequencyCycle } from "./batched-frequency-cycle.js";

/** One step of the batched frequency cycle calculation. */
export interface BatchedFrequencyCycleStep {
  describe(): string;
  adjust(item: BatchedFrequencyCycle, value: number): number;
}

export class RoundingBatchedFrequencyCycleAdjuster implements BatchedFrequencyCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFrequencyCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBatchedFrequencyCycleAdjuster implements BatchedFrequencyCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFrequencyCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedFrequencyCycleAdjuster implements BatchedFrequencyCycleStep {
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

  adjust(item: BatchedFrequencyCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched frequency cycle steps in order and keeps a trace of each. */
export class BatchedFrequencyCycleEngine {
  steps: BatchedFrequencyCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFrequencyCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedFrequencyCycle): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BatchedFrequencyCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedFrequencyCycleEngine(flagsValue: flags.Registry): BatchedFrequencyCycleEngine {
  return new BatchedFrequencyCycleEngine(
    [
      new RoundingBatchedFrequencyCycleAdjuster(0.25),
      new PercentBatchedFrequencyCycleAdjuster(-14.1),
      new FlaggedBatchedFrequencyCycleAdjuster(flagsValue, "batched-frequency-cycle-batched", -6.1),
    ],
    [],
    1.8,
    25551.1,
  );
}
