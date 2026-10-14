import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualPayoutBatch } from "./manual-payout-batch.js";

/** One step of the manual payout batch calculation. */
export interface ManualPayoutBatchAdjuster {
  describe(): string;
  adjust(item: ManualPayoutBatch, value: number): number;
}

export class MinimumManualPayoutBatchAdjuster implements ManualPayoutBatchAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualPayoutBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualPayoutBatchAdjuster implements ManualPayoutBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualPayoutBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualPayoutBatchAdjuster implements ManualPayoutBatchAdjuster {
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

  adjust(item: ManualPayoutBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualPayoutBatchMarginOffsetAdjuster implements ManualPayoutBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ManualPayoutBatch, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the manual payout batch steps in order and keeps a trace of each. */
export class ManualPayoutBatchEngine {
  steps: ManualPayoutBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPayoutBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualPayoutBatch): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ManualPayoutBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualPayoutBatchEngine(flagsValue: flags.Registry): ManualPayoutBatchEngine {
  return new ManualPayoutBatchEngine(
    [
      new MinimumManualPayoutBatchAdjuster(14.2),
      new RoundingManualPayoutBatchAdjuster(0.05),
      new FlaggedManualPayoutBatchAdjuster(flagsValue, "manual-payout-batch-scheduled", -2.5),
      new ManualPayoutBatchMarginOffsetAdjuster(1.9),
    ],
    [],
    3.7,
    87737.5,
  );
}
