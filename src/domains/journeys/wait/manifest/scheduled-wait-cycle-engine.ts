import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWaitCycle } from "./scheduled-wait-cycle.js";

/** One step of the scheduled wait cycle calculation. */
export interface ScheduledWaitCycleModifier {
  describe(): string;
  adjust(item: ScheduledWaitCycle, value: number): number;
}

export class TieredScheduledWaitCycleAdjuster implements ScheduledWaitCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledWaitCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapScheduledWaitCycleAdjuster implements ScheduledWaitCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledWaitCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledWaitCycleAdjuster implements ScheduledWaitCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledWaitCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled wait cycle steps in order and keeps a trace of each. */
export class ScheduledWaitCycleEngine {
  steps: ScheduledWaitCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWaitCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledWaitCycle): number {
    let current = item.netVolume();
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

  evaluateAll(items: ScheduledWaitCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledWaitCycleEngine(): ScheduledWaitCycleEngine {
  return new ScheduledWaitCycleEngine(
    [
      new TieredScheduledWaitCycleAdjuster([2465, 6111, 6292, 9483], [0.93, 1.05, 1.19, 1.06]),
      new CapScheduledWaitCycleAdjuster(8881),
      new MinimumScheduledWaitCycleAdjuster(21.2),
    ],
    [],
    0.2,
    49631.7,
  );
}
