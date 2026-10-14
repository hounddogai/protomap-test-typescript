import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintAllocation } from "./complaint-allocation.js";

/** One step of the complaint allocation calculation. */
export interface ComplaintAllocationFactor {
  describe(): string;
  adjust(item: ComplaintAllocation, value: number): number;
}

export class FlaggedComplaintAllocationAdjuster implements ComplaintAllocationFactor {
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

  adjust(item: ComplaintAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapComplaintAllocationAdjuster implements ComplaintAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentComplaintAllocationAdjuster implements ComplaintAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ComplaintAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingComplaintAllocationAdjuster implements ComplaintAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ComplaintAllocationFrequencyCapOffsetAdjuster implements ComplaintAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: ComplaintAllocation, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class PercentComplaintAllocationAdjuster implements ComplaintAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the complaint allocation steps in order and keeps a trace of each. */
export class ComplaintAllocationEngine {
  steps: ComplaintAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ComplaintAllocation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ComplaintAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultComplaintAllocationEngine(flagsValue: flags.Registry): ComplaintAllocationEngine {
  return new ComplaintAllocationEngine(
    [
      new FlaggedComplaintAllocationAdjuster(flagsValue, "complaint-allocation-scheduled", -5.4),
      new CapComplaintAllocationAdjuster(49743),
      new SegmentComplaintAllocationAdjuster(
        new Map<string, number>([["central", 1.3], ["retail", 0.95], ["west", 1.12]]),
      ),
      new RoundingComplaintAllocationAdjuster(0.25),
      new ComplaintAllocationFrequencyCapOffsetAdjuster(1.03),
      new PercentComplaintAllocationAdjuster(-9.5),
    ],
    [],
    0.1,
    75826.7,
  );
}
