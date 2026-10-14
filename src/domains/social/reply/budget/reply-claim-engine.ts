import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyClaim } from "./reply-claim.js";

/** One step of the reply claim calculation. */
export interface ReplyClaimStep {
  describe(): string;
  adjust(item: ReplyClaim, value: number): number;
}

export class FlaggedReplyClaimAdjuster implements ReplyClaimStep {
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

  adjust(item: ReplyClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapReplyClaimAdjuster implements ReplyClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingReplyClaimAdjuster implements ReplyClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ReplyClaimBidOffsetAdjuster implements ReplyClaimStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: ReplyClaim, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the reply claim steps in order and keeps a trace of each. */
export class ReplyClaimEngine {
  steps: ReplyClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReplyClaim): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ReplyClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReplyClaimEngine(flagsValue: flags.Registry): ReplyClaimEngine {
  return new ReplyClaimEngine(
    [
      new FlaggedReplyClaimAdjuster(flagsValue, "reply-claim-pending", 4.8),
      new CapReplyClaimAdjuster(29175),
      new RoundingReplyClaimAdjuster(0.25),
      new ReplyClaimBidOffsetAdjuster(1.13),
    ],
    [],
    4.5,
    66786.3,
  );
}
