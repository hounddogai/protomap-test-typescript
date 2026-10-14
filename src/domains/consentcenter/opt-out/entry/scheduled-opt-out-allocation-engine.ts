import * as numbers from "../../../../kit/numbers.js";
import { ScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

/** One step of the scheduled opt out allocation calculation. */
export interface ScheduledOptOutAllocationModifier {
  describe(): string;
  adjust(item: ScheduledOptOutAllocation, value: number): number;
}

export class LocaleScheduledOptOutAllocationAdjuster implements ScheduledOptOutAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ScheduledOptOutAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentScheduledOptOutAllocationAdjuster implements ScheduledOptOutAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledOptOutAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledOptOutAllocationAdjuster implements ScheduledOptOutAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledOptOutAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled opt out allocation steps in order and keeps a trace of each. */
export class ScheduledOptOutAllocationEngine {
  steps: ScheduledOptOutAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledOptOutAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledOptOutAllocation): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ScheduledOptOutAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledOptOutAllocationEngine(): ScheduledOptOutAllocationEngine {
  return new ScheduledOptOutAllocationEngine(
    [
      new LocaleScheduledOptOutAllocationAdjuster(new Map<string, number>([["central", 1]])),
      new PercentScheduledOptOutAllocationAdjuster(5.6),
      new CapScheduledOptOutAllocationAdjuster(33670),
    ],
    [],
    3.2,
    31726.3,
  );
}
