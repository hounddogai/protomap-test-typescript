import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueDigest } from "./queue-digest.js";

/** One step of the queue digest calculation. */
export interface QueueDigestModifier {
  describe(): string;
  adjust(item: QueueDigest, value: number): number;
}

export class FlaggedQueueDigestAdjuster implements QueueDigestModifier {
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

  adjust(item: QueueDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentQueueDigestAdjuster implements QueueDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class QueueDigestFrequencyCapOffsetAdjuster implements QueueDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: QueueDigest, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class CapQueueDigestAdjuster implements QueueDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the queue digest steps in order and keeps a trace of each. */
export class QueueDigestEngine {
  steps: QueueDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: QueueDigest): number {
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

  evaluateAll(items: QueueDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultQueueDigestEngine(flagsValue: flags.Registry): QueueDigestEngine {
  return new QueueDigestEngine(
    [
      new FlaggedQueueDigestAdjuster(flagsValue, "queue-digest-default", -2.7),
      new PercentQueueDigestAdjuster(19.1),
      new QueueDigestFrequencyCapOffsetAdjuster(0.85),
      new CapQueueDigestAdjuster(17684),
    ],
    [],
    3.5,
    42167.8,
  );
}
