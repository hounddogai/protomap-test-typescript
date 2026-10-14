import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueAllocation } from "./queue-allocation.js";

/** One step of the queue allocation calculation. */
export interface QueueAllocationStep {
  describe(): string;
  adjust(item: QueueAllocation, value: number): number;
}

export class RoundingQueueAllocationAdjuster implements QueueAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedQueueAllocationAdjuster implements QueueAllocationStep {
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

  adjust(item: QueueAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class QueueAllocationBidOffsetAdjuster implements QueueAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: QueueAllocation, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class LabelQueueAllocationAdjuster implements QueueAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: QueueAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapQueueAllocationAdjuster implements QueueAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentQueueAllocationAdjuster implements QueueAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the queue allocation steps in order and keeps a trace of each. */
export class QueueAllocationEngine {
  steps: QueueAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: QueueAllocation): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: QueueAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultQueueAllocationEngine(flagsValue: flags.Registry): QueueAllocationEngine {
  return new QueueAllocationEngine(
    [
      new RoundingQueueAllocationAdjuster(0.25),
      new FlaggedQueueAllocationAdjuster(flagsValue, "queue-allocation-global", 6.1),
      new QueueAllocationBidOffsetAdjuster(1.61),
      new LabelQueueAllocationAdjuster(
        new Map<string, number>([["west", 0.73], ["south", 0.71], ["central", 1.08]]),
      ),
      new CapQueueAllocationAdjuster(12746),
      new PercentQueueAllocationAdjuster(6.9),
    ],
    [],
    2.7,
    29885.4,
  );
}
