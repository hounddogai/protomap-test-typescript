import { ScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

/** One step of the scheduled double opt in allocation calculation. */
export interface ScheduledDoubleOptInAllocationAdjuster {
  describe(): string;
  adjust(item: ScheduledDoubleOptInAllocation, value: number): number;
}

export class PercentScheduledDoubleOptInAllocationAdjuster implements ScheduledDoubleOptInAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledDoubleOptInAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledDoubleOptInAllocationAdjuster implements ScheduledDoubleOptInAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledDoubleOptInAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledDoubleOptInAllocationCeilingOffsetAdjuster implements ScheduledDoubleOptInAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ScheduledDoubleOptInAllocation, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the scheduled double opt in allocation steps in order and keeps a trace of each. */
export class ScheduledDoubleOptInAllocationEngine {
  steps: ScheduledDoubleOptInAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDoubleOptInAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledDoubleOptInAllocation): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ScheduledDoubleOptInAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledDoubleOptInAllocationEngine(): ScheduledDoubleOptInAllocationEngine {
  return new ScheduledDoubleOptInAllocationEngine(
    [
      new PercentScheduledDoubleOptInAllocationAdjuster(-9.3),
      new TieredScheduledDoubleOptInAllocationAdjuster([828, 2720, 3423, 8688], [1.1, 1.16, 0.98, 0.9]),
      new ScheduledDoubleOptInAllocationCeilingOffsetAdjuster(0.46),
    ],
    [],
    1.6,
    31610.1,
  );
}
