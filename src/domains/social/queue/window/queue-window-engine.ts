import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueWindow } from "./queue-window.js";

/** One step of the queue window calculation. */
export interface QueueWindowFactor {
  describe(): string;
  adjust(item: QueueWindow, value: number): number;
}

export class QueueWindowCapacityOffsetAdjuster implements QueueWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: QueueWindow, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class FlaggedQueueWindowAdjuster implements QueueWindowFactor {
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

  adjust(item: QueueWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumQueueWindowAdjuster implements QueueWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingQueueWindowAdjuster implements QueueWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the queue window steps in order and keeps a trace of each. */
export class QueueWindowEngine {
  steps: QueueWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: QueueWindow): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: QueueWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultQueueWindowEngine(flagsValue: flags.Registry): QueueWindowEngine {
  return new QueueWindowEngine(
    [
      new QueueWindowCapacityOffsetAdjuster(0.44),
      new FlaggedQueueWindowAdjuster(flagsValue, "queue-window-legacy", 1.2),
      new MinimumQueueWindowAdjuster(23.3),
      new RoundingQueueWindowAdjuster(0.5),
    ],
    [],
    2.3,
    50743,
  );
}
