import * as flags from "../../../../kit/flags.js";
import { QueueDraft } from "./queue-draft.js";

/** One step of the queue draft calculation. */
export interface QueueDraftAdjuster {
  describe(): string;
  adjust(item: QueueDraft, value: number): number;
}

export class FlaggedQueueDraftAdjuster implements QueueDraftAdjuster {
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

  adjust(item: QueueDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumQueueDraftAdjuster implements QueueDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapQueueDraftAdjuster implements QueueDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentQueueDraftAdjuster implements QueueDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the queue draft steps in order and keeps a trace of each. */
export class QueueDraftEngine {
  steps: QueueDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueueDraft): number {
    let current = item.projectedValue();
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

  evaluateAll(items: QueueDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueueDraftEngine(flagsValue: flags.Registry): QueueDraftEngine {
  return new QueueDraftEngine(
    [
      new FlaggedQueueDraftAdjuster(flagsValue, "queue-draft-strict", 0.5),
      new MinimumQueueDraftAdjuster(3.8),
      new CapQueueDraftAdjuster(24868),
      new PercentQueueDraftAdjuster(14.5),
    ],
    [],
    2,
    18789.8,
  );
}
