import * as flags from "../../../../kit/flags.js";
import { SenderSegment } from "./sender-segment.js";

/** One step of the sender segment calculation. */
export interface SenderSegmentAdjuster {
  describe(): string;
  adjust(item: SenderSegment, value: number): number;
}

export class SenderSegmentScoreOffsetAdjuster implements SenderSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: SenderSegment, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentSenderSegmentAdjuster implements SenderSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSenderSegmentAdjuster implements SenderSegmentAdjuster {
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

  adjust(item: SenderSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelSenderSegmentAdjuster implements SenderSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SenderSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the sender segment steps in order and keeps a trace of each. */
export class SenderSegmentEngine {
  steps: SenderSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SenderSegment): number {
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

  evaluateAll(items: SenderSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSenderSegmentEngine(flagsValue: flags.Registry): SenderSegmentEngine {
  return new SenderSegmentEngine(
    [
      new SenderSegmentScoreOffsetAdjuster(0.79),
      new PercentSenderSegmentAdjuster(-2.2),
      new FlaggedSenderSegmentAdjuster(flagsValue, "sender-segment-strict", -3.5),
      new LabelSenderSegmentAdjuster(new Map<string, number>([["east", 0.89]])),
    ],
    [],
    3.3,
    85486.3,
  );
}
