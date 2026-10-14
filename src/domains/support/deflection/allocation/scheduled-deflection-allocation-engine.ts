import { ScheduledDeflectionAllocation } from "./scheduled-deflection-allocation.js";

/** One step of the scheduled deflection allocation calculation. */
export interface ScheduledDeflectionAllocationStep {
  describe(): string;
  adjust(item: ScheduledDeflectionAllocation, value: number): number;
}

export class ScheduledDeflectionAllocationStartsAtOffsetAdjuster implements ScheduledDeflectionAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: ScheduledDeflectionAllocation, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class PercentScheduledDeflectionAllocationAdjuster implements ScheduledDeflectionAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledDeflectionAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledDeflectionAllocationAdjuster implements ScheduledDeflectionAllocationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledDeflectionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled deflection allocation steps in order and keeps a trace of each. */
export class ScheduledDeflectionAllocationEngine {
  steps: ScheduledDeflectionAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDeflectionAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledDeflectionAllocation): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ScheduledDeflectionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledDeflectionAllocationEngine(): ScheduledDeflectionAllocationEngine {
  return new ScheduledDeflectionAllocationEngine(
    [
      new ScheduledDeflectionAllocationStartsAtOffsetAdjuster(0.31),
      new PercentScheduledDeflectionAllocationAdjuster(21.3),
      new TieredScheduledDeflectionAllocationAdjuster([2859, 5164, 8227], [0.89, 0.94, 1.15]),
    ],
    [],
    0.9,
    45923.8,
  );
}
