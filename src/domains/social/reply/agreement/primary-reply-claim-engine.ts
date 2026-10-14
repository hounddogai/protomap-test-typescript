import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryReplyClaim } from "./primary-reply-claim.js";

/** One step of the primary reply claim calculation. */
export interface PrimaryReplyClaimStep {
  describe(): string;
  adjust(item: PrimaryReplyClaim, value: number): number;
}

export class CapPrimaryReplyClaimAdjuster implements PrimaryReplyClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryReplyClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPrimaryReplyClaimAdjuster implements PrimaryReplyClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryReplyClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPrimaryReplyClaimAdjuster implements PrimaryReplyClaimStep {
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

  adjust(item: PrimaryReplyClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryReplyClaimAdjuster implements PrimaryReplyClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryReplyClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary reply claim steps in order and keeps a trace of each. */
export class PrimaryReplyClaimEngine {
  steps: PrimaryReplyClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryReplyClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryReplyClaim): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PrimaryReplyClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryReplyClaimEngine(flagsValue: flags.Registry): PrimaryReplyClaimEngine {
  return new PrimaryReplyClaimEngine(
    [
      new CapPrimaryReplyClaimAdjuster(40806),
      new MinimumPrimaryReplyClaimAdjuster(6.5),
      new FlaggedPrimaryReplyClaimAdjuster(flagsValue, "primary-reply-claim-rolling", -5.2),
      new RoundingPrimaryReplyClaimAdjuster(5),
    ],
    [],
    0.6,
    21274.6,
  );
}
