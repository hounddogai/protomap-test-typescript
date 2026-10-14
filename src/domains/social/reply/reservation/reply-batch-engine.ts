import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyBatch } from "./reply-batch.js";

/** One step of the reply batch calculation. */
export interface ReplyBatchModifier {
  describe(): string;
  adjust(item: ReplyBatch, value: number): number;
}

export class RoundingReplyBatchAdjuster implements ReplyBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelReplyBatchAdjuster implements ReplyBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReplyBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ReplyBatchSendAtOffsetAdjuster implements ReplyBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ReplyBatch, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class PercentReplyBatchAdjuster implements ReplyBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplyBatchAdjuster implements ReplyBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedReplyBatchAdjuster implements ReplyBatchModifier {
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

  adjust(item: ReplyBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reply batch steps in order and keeps a trace of each. */
export class ReplyBatchEngine {
  steps: ReplyBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyBatch): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ReplyBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyBatchEngine(flagsValue: flags.Registry): ReplyBatchEngine {
  return new ReplyBatchEngine(
    [
      new RoundingReplyBatchAdjuster(0.05),
      new LabelReplyBatchAdjuster(
        new Map<string, number>([["retail", 1.15], ["north", 1.29], ["central", 1.31]]),
      ),
      new ReplyBatchSendAtOffsetAdjuster(0.5),
      new PercentReplyBatchAdjuster(-7.9),
      new TieredReplyBatchAdjuster([4212, 5989], [0.93, 0.92]),
      new FlaggedReplyBatchAdjuster(flagsValue, "reply-batch-capped", 4),
    ],
    [],
    3.9,
    3660.6,
  );
}
