import * as numbers from "../../../../kit/numbers.js";
import { RegionalQueueTarget } from "./regional-queue-target.js";

/** One step of the regional queue target calculation. */
export interface RegionalQueueTargetAdjuster {
  describe(): string;
  adjust(item: RegionalQueueTarget, value: number): number;
}

export class RoundingRegionalQueueTargetAdjuster implements RegionalQueueTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalQueueTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalQueueTargetAdjuster implements RegionalQueueTargetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalQueueTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalQueueTargetAdjuster implements RegionalQueueTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalQueueTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional queue target steps in order and keeps a trace of each. */
export class RegionalQueueTargetEngine {
  steps: RegionalQueueTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalQueueTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalQueueTarget): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RegionalQueueTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalQueueTargetEngine(): RegionalQueueTargetEngine {
  return new RegionalQueueTargetEngine(
    [
      new RoundingRegionalQueueTargetAdjuster(5),
      new CapRegionalQueueTargetAdjuster(17129),
      new MinimumRegionalQueueTargetAdjuster(27.8),
    ],
    [],
    4.8,
    96430.1,
  );
}
