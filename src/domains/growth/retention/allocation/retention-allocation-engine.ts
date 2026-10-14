import * as flags from "../../../../kit/flags.js";
import { RetentionAllocation } from "./retention-allocation.js";

/** One step of the retention allocation calculation. */
export interface RetentionAllocationAdjuster {
  describe(): string;
  adjust(item: RetentionAllocation, value: number): number;
}

export class RetentionAllocationDiscountOffsetAdjuster implements RetentionAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RetentionAllocation, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class ChannelRetentionAllocationAdjuster implements RetentionAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RetentionAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRetentionAllocationAdjuster implements RetentionAllocationAdjuster {
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

  adjust(item: RetentionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention allocation steps in order and keeps a trace of each. */
export class RetentionAllocationEngine {
  steps: RetentionAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionAllocation): number {
    let current = item.netExposure();
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

  evaluateAll(items: RetentionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionAllocationEngine(flagsValue: flags.Registry): RetentionAllocationEngine {
  return new RetentionAllocationEngine(
    [
      new RetentionAllocationDiscountOffsetAdjuster(0.7),
      new ChannelRetentionAllocationAdjuster(
        new Map<string, number>([["west", 1.29], ["retail", 1.03], ["north", 1.19]]),
      ),
      new FlaggedRetentionAllocationAdjuster(flagsValue, "retention-allocation-capped", -9.3),
    ],
    [],
    4,
    7148.8,
  );
}
