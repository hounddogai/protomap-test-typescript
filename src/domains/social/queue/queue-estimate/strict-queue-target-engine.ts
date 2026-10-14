import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictQueueTarget } from "./strict-queue-target.js";

/** One step of the strict queue target calculation. */
export interface StrictQueueTargetFactor {
  describe(): string;
  adjust(item: StrictQueueTarget, value: number): number;
}

export class StrictQueueTargetCapacityOffsetAdjuster implements StrictQueueTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: StrictQueueTarget, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class PercentStrictQueueTargetAdjuster implements StrictQueueTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictQueueTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictQueueTargetAdjuster implements StrictQueueTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictQueueTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStrictQueueTargetAdjuster implements StrictQueueTargetFactor {
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

  adjust(item: StrictQueueTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict queue target steps in order and keeps a trace of each. */
export class StrictQueueTargetEngine {
  steps: StrictQueueTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictQueueTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictQueueTarget): number {
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

  evaluateAll(items: StrictQueueTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictQueueTargetEngine(flagsValue: flags.Registry): StrictQueueTargetEngine {
  return new StrictQueueTargetEngine(
    [
      new StrictQueueTargetCapacityOffsetAdjuster(0.97),
      new PercentStrictQueueTargetAdjuster(-2.9),
      new MinimumStrictQueueTargetAdjuster(5.1),
      new FlaggedStrictQueueTargetAdjuster(flagsValue, "strict-queue-target-primary", 4.7),
    ],
    [],
    2.7,
    35559.3,
  );
}
