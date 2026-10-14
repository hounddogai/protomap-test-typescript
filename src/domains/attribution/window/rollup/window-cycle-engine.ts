import * as numbers from "../../../../kit/numbers.js";
import { WindowCycle } from "./window-cycle.js";

/** One step of the window cycle calculation. */
export interface WindowCycleAdjuster {
  describe(): string;
  adjust(item: WindowCycle, value: number): number;
}

export class CapWindowCycleAdjuster implements WindowCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleWindowCycleAdjuster implements WindowCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WindowCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWindowCycleAdjuster implements WindowCycleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the window cycle steps in order and keeps a trace of each. */
export class WindowCycleEngine {
  steps: WindowCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowCycle): number {
    let current = item.netTotal();
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

  evaluateAll(items: WindowCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowCycleEngine(): WindowCycleEngine {
  return new WindowCycleEngine(
    [
      new CapWindowCycleAdjuster(8976),
      new TitleWindowCycleAdjuster(new Map<string, number>([["west", 1.16], ["north", 0.9]])),
      new MinimumWindowCycleAdjuster(1.5),
    ],
    [],
    4.1,
    97447.2,
  );
}
