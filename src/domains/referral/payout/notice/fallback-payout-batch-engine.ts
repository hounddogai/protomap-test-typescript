import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackPayoutBatch } from "./fallback-payout-batch.js";

/** One step of the fallback payout batch calculation. */
export interface FallbackPayoutBatchAdjuster {
  describe(): string;
  adjust(item: FallbackPayoutBatch, value: number): number;
}

export class PercentFallbackPayoutBatchAdjuster implements FallbackPayoutBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPayoutBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackPayoutBatchAdjuster implements FallbackPayoutBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPayoutBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFallbackPayoutBatchAdjuster implements FallbackPayoutBatchAdjuster {
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

  adjust(item: FallbackPayoutBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback payout batch steps in order and keeps a trace of each. */
export class FallbackPayoutBatchEngine {
  steps: FallbackPayoutBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPayoutBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackPayoutBatch): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: FallbackPayoutBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackPayoutBatchEngine(flagsValue: flags.Registry): FallbackPayoutBatchEngine {
  return new FallbackPayoutBatchEngine(
    [
      new PercentFallbackPayoutBatchAdjuster(8.6),
      new RoundingFallbackPayoutBatchAdjuster(0.05),
      new FlaggedFallbackPayoutBatchAdjuster(flagsValue, "fallback-payout-batch-strict", -1.1),
    ],
    [],
    1.6,
    12549.5,
  );
}
