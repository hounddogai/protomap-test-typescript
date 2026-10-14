import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientOptOutBatch } from "./lenient-opt-out-batch.js";

/** One step of the lenient opt out batch calculation. */
export interface LenientOptOutBatchFactor {
  describe(): string;
  adjust(item: LenientOptOutBatch, value: number): number;
}

export class FlaggedLenientOptOutBatchAdjuster implements LenientOptOutBatchFactor {
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

  adjust(item: LenientOptOutBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientOptOutBatchAdjuster implements LenientOptOutBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientOptOutBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLenientOptOutBatchAdjuster implements LenientOptOutBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientOptOutBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient opt out batch steps in order and keeps a trace of each. */
export class LenientOptOutBatchEngine {
  steps: LenientOptOutBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientOptOutBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientOptOutBatch): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LenientOptOutBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientOptOutBatchEngine(flagsValue: flags.Registry): LenientOptOutBatchEngine {
  return new LenientOptOutBatchEngine(
    [
      new FlaggedLenientOptOutBatchAdjuster(flagsValue, "lenient-opt-out-batch-global", -3.6),
      new RoundingLenientOptOutBatchAdjuster(0.25),
      new PercentLenientOptOutBatchAdjuster(0.6),
    ],
    [],
    4.8,
    43857.3,
  );
}
