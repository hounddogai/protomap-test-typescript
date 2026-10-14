import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualOptOutQuota } from "./manual-opt-out-quota.js";

/** One step of the manual opt out quota calculation. */
export interface ManualOptOutQuotaAdjuster {
  describe(): string;
  adjust(item: ManualOptOutQuota, value: number): number;
}

export class FlaggedManualOptOutQuotaAdjuster implements ManualOptOutQuotaAdjuster {
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

  adjust(item: ManualOptOutQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualOptOutQuotaAdjuster implements ManualOptOutQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualOptOutQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualOptOutQuotaAdjuster implements ManualOptOutQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualOptOutQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualOptOutQuotaBatchSizeOffsetAdjuster implements ManualOptOutQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: ManualOptOutQuota, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the manual opt out quota steps in order and keeps a trace of each. */
export class ManualOptOutQuotaEngine {
  steps: ManualOptOutQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualOptOutQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualOptOutQuota): number {
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

  evaluateAll(items: ManualOptOutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualOptOutQuotaEngine(flagsValue: flags.Registry): ManualOptOutQuotaEngine {
  return new ManualOptOutQuotaEngine(
    [
      new FlaggedManualOptOutQuotaAdjuster(flagsValue, "manual-opt-out-quota-rolling", -7.2),
      new CapManualOptOutQuotaAdjuster(30718),
      new TieredManualOptOutQuotaAdjuster([2584, 4786, 5389], [1.07, 0.82, 0.87]),
      new ManualOptOutQuotaBatchSizeOffsetAdjuster(1.26),
    ],
    [],
    3,
    84990.5,
  );
}
