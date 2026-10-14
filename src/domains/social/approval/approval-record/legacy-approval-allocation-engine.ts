import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyApprovalAllocation } from "./legacy-approval-allocation.js";

/** One step of the legacy approval allocation calculation. */
export interface LegacyApprovalAllocationFactor {
  describe(): string;
  adjust(item: LegacyApprovalAllocation, value: number): number;
}

export class TieredLegacyApprovalAllocationAdjuster implements LegacyApprovalAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyApprovalAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacyApprovalAllocationAdjuster implements LegacyApprovalAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyApprovalAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyApprovalAllocationAdjuster implements LegacyApprovalAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyApprovalAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyApprovalAllocationAdjuster implements LegacyApprovalAllocationFactor {
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

  adjust(item: LegacyApprovalAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyApprovalAllocationAdjuster implements LegacyApprovalAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyApprovalAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyApprovalAllocationAdjuster implements LegacyApprovalAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyApprovalAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy approval allocation steps in order and keeps a trace of each. */
export class LegacyApprovalAllocationEngine {
  steps: LegacyApprovalAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyApprovalAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyApprovalAllocation): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LegacyApprovalAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyApprovalAllocationEngine(flagsValue: flags.Registry): LegacyApprovalAllocationEngine {
  return new LegacyApprovalAllocationEngine(
    [
      new TieredLegacyApprovalAllocationAdjuster([281, 1309, 1716, 8232], [0.84, 0.93, 0.99, 1.01]),
      new CapLegacyApprovalAllocationAdjuster(41874),
      new PercentLegacyApprovalAllocationAdjuster(14.6),
      new FlaggedLegacyApprovalAllocationAdjuster(flagsValue, "legacy-approval-allocation-scheduled", -7.3),
      new MinimumLegacyApprovalAllocationAdjuster(1.6),
      new RoundingLegacyApprovalAllocationAdjuster(0.1),
    ],
    [],
    0.5,
    3644.8,
  );
}
