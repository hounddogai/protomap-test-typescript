import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledQueueRollup } from "./scheduled-queue-rollup.js";

/** One step of the scheduled queue rollup calculation. */
export interface ScheduledQueueRollupModifier {
  describe(): string;
  adjust(item: ScheduledQueueRollup, value: number): number;
}

export class TieredScheduledQueueRollupAdjuster implements ScheduledQueueRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledQueueRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapScheduledQueueRollupAdjuster implements ScheduledQueueRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledQueueRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledQueueRollupAdjuster implements ScheduledQueueRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledQueueRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedScheduledQueueRollupAdjuster implements ScheduledQueueRollupModifier {
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

  adjust(item: ScheduledQueueRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledQueueRollupAdjuster implements ScheduledQueueRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledQueueRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled queue rollup steps in order and keeps a trace of each. */
export class ScheduledQueueRollupEngine {
  steps: ScheduledQueueRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledQueueRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledQueueRollup): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ScheduledQueueRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledQueueRollupEngine(flagsValue: flags.Registry): ScheduledQueueRollupEngine {
  return new ScheduledQueueRollupEngine(
    [
      new TieredScheduledQueueRollupAdjuster([1654, 2665, 5365, 5858], [1.11, 1.18, 0.85, 1.1]),
      new CapScheduledQueueRollupAdjuster(42200),
      new MinimumScheduledQueueRollupAdjuster(25.8),
      new FlaggedScheduledQueueRollupAdjuster(flagsValue, "scheduled-queue-rollup-manual", -4.3),
      new RoundingScheduledQueueRollupAdjuster(1),
    ],
    [],
    1.3,
    29929.1,
  );
}
