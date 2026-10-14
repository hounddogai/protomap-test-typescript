import * as numbers from "../../../../kit/numbers.js";
import { PendingLevelCycle } from "./pending-level-cycle.js";

/** One step of the pending level cycle calculation. */
export interface PendingLevelCycleModifier {
  describe(): string;
  adjust(item: PendingLevelCycle, value: number): number;
}

export class CapPendingLevelCycleAdjuster implements PendingLevelCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingLevelCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingLevelCycleAdjuster implements PendingLevelCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingLevelCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingLevelCycleAdjuster implements PendingLevelCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingLevelCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending level cycle steps in order and keeps a trace of each. */
export class PendingLevelCycleEngine {
  steps: PendingLevelCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingLevelCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingLevelCycle): number {
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

  evaluateAll(items: PendingLevelCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingLevelCycleEngine(): PendingLevelCycleEngine {
  return new PendingLevelCycleEngine(
    [
      new CapPendingLevelCycleAdjuster(12973),
      new MinimumPendingLevelCycleAdjuster(34.5),
      new PercentPendingLevelCycleAdjuster(-20.5),
    ],
    [],
    4.1,
    96455.7,
  );
}
