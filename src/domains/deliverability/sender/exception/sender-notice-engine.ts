import * as flags from "../../../../kit/flags.js";
import { SenderNotice } from "./sender-notice.js";

/** One step of the sender notice calculation. */
export interface SenderNoticeStep {
  describe(): string;
  adjust(item: SenderNotice, value: number): number;
}

export class TieredSenderNoticeAdjuster implements SenderNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSenderNoticeAdjuster implements SenderNoticeStep {
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

  adjust(item: SenderNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSenderNoticeAdjuster implements SenderNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sender notice steps in order and keeps a trace of each. */
export class SenderNoticeEngine {
  steps: SenderNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SenderNotice): number {
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

  evaluateAll(items: SenderNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSenderNoticeEngine(flagsValue: flags.Registry): SenderNoticeEngine {
  return new SenderNoticeEngine(
    [
      new TieredSenderNoticeAdjuster([1222, 1262, 6869, 7884], [1.15, 0.89, 0.82, 0.9]),
      new FlaggedSenderNoticeAdjuster(flagsValue, "sender-notice-capped", -5.5),
      new CapSenderNoticeAdjuster(11487),
    ],
    [],
    4.7,
    48142.6,
  );
}
