import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingReputationAllocation } from "./pending-reputation-allocation.js";

/** One step of the pending reputation allocation calculation. */
export interface PendingReputationAllocationModifier {
  describe(): string;
  adjust(item: PendingReputationAllocation, value: number): number;
}

export class RoundingPendingReputationAllocationAdjuster implements PendingReputationAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingReputationAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPendingReputationAllocationAdjuster implements PendingReputationAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingReputationAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingReputationAllocationAdjuster implements PendingReputationAllocationModifier {
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

  adjust(item: PendingReputationAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingReputationAllocationAdjuster implements PendingReputationAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingReputationAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingReputationAllocationAdjuster implements PendingReputationAllocationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingReputationAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending reputation allocation steps in order and keeps a trace of each. */
export class PendingReputationAllocationEngine {
  steps: PendingReputationAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingReputationAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingReputationAllocation): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PendingReputationAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingReputationAllocationEngine(flagsValue: flags.Registry): PendingReputationAllocationEngine {
  return new PendingReputationAllocationEngine(
    [
      new RoundingPendingReputationAllocationAdjuster(5),
      new MinimumPendingReputationAllocationAdjuster(34.1),
      new FlaggedPendingReputationAllocationAdjuster(flagsValue, "pending-reputation-allocation-lenient", 6.8),
      new CapPendingReputationAllocationAdjuster(43390),
      new TieredPendingReputationAllocationAdjuster([268, 2606, 8302], [0.91, 1.17, 0.99]),
    ],
    [],
    0.7,
    47032.6,
  );
}
