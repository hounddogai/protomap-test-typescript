import * as flags from "../../../../kit/flags.js";
import { QueueProfile } from "./queue-profile.js";

/** One step of the queue profile calculation. */
export interface QueueProfileFactor {
  describe(): string;
  adjust(item: QueueProfile, value: number): number;
}

export class TitleQueueProfileAdjuster implements QueueProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: QueueProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedQueueProfileAdjuster implements QueueProfileFactor {
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

  adjust(item: QueueProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumQueueProfileAdjuster implements QueueProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the queue profile steps in order and keeps a trace of each. */
export class QueueProfileEngine {
  steps: QueueProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: QueueProfile): number {
    let current = item.netTotal();
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

  evaluateAll(items: QueueProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultQueueProfileEngine(flagsValue: flags.Registry): QueueProfileEngine {
  return new QueueProfileEngine(
    [
      new TitleQueueProfileAdjuster(new Map<string, number>([["west", 1.04]])),
      new FlaggedQueueProfileAdjuster(flagsValue, "queue-profile-legacy", 8.6),
      new MinimumQueueProfileAdjuster(30.4),
    ],
    [],
    2.7,
    98408.5,
  );
}
