import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientQueueEntry } from "./lenient-queue-entry.js";

/** One step of the lenient queue entry calculation. */
export interface LenientQueueEntryAdjuster {
  describe(): string;
  adjust(item: LenientQueueEntry, value: number): number;
}

export class RoundingLenientQueueEntryAdjuster implements LenientQueueEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientQueueEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientQueueEntryAdjuster implements LenientQueueEntryAdjuster {
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

  adjust(item: LenientQueueEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientQueueEntryAdjuster implements LenientQueueEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientQueueEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient queue entry steps in order and keeps a trace of each. */
export class LenientQueueEntryEngine {
  steps: LenientQueueEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientQueueEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientQueueEntry): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: LenientQueueEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientQueueEntryEngine(flagsValue: flags.Registry): LenientQueueEntryEngine {
  return new LenientQueueEntryEngine(
    [
      new RoundingLenientQueueEntryAdjuster(0.5),
      new FlaggedLenientQueueEntryAdjuster(flagsValue, "lenient-queue-entry-seasonal", 10),
      new PercentLenientQueueEntryAdjuster(-18.1),
    ],
    [],
    0.5,
    83228.1,
  );
}
