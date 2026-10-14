import * as flags from "../../../../kit/flags.js";
import { InviteRollup } from "./invite-rollup.js";

/** One step of the invite rollup calculation. */
export interface InviteRollupModifier {
  describe(): string;
  adjust(item: InviteRollup, value: number): number;
}

export class SegmentInviteRollupAdjuster implements InviteRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: InviteRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInviteRollupAdjuster implements InviteRollupModifier {
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

  adjust(item: InviteRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapInviteRollupAdjuster implements InviteRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumInviteRollupAdjuster implements InviteRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the invite rollup steps in order and keeps a trace of each. */
export class InviteRollupEngine {
  steps: InviteRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteRollup): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: InviteRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteRollupEngine(flagsValue: flags.Registry): InviteRollupEngine {
  return new InviteRollupEngine(
    [
      new SegmentInviteRollupAdjuster(new Map<string, number>([["west", 1], ["retail", 0.96], ["south", 0.88]])),
      new FlaggedInviteRollupAdjuster(flagsValue, "invite-rollup-manual", -6.4),
      new CapInviteRollupAdjuster(12377),
      new MinimumInviteRollupAdjuster(47.9),
    ],
    [],
    4.6,
    46004.6,
  );
}
