import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteOverride } from "./invite-override.js";

/** One step of the invite override calculation. */
export interface InviteOverrideAdjuster {
  describe(): string;
  adjust(item: InviteOverride, value: number): number;
}

export class SegmentInviteOverrideAdjuster implements InviteOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: InviteOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentInviteOverrideAdjuster implements InviteOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInviteOverrideAdjuster implements InviteOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInviteOverrideAdjuster implements InviteOverrideAdjuster {
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

  adjust(item: InviteOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class InviteOverrideAttemptsOffsetAdjuster implements InviteOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: InviteOverride, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the invite override steps in order and keeps a trace of each. */
export class InviteOverrideEngine {
  steps: InviteOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InviteOverride): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: InviteOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInviteOverrideEngine(flagsValue: flags.Registry): InviteOverrideEngine {
  return new InviteOverrideEngine(
    [
      new SegmentInviteOverrideAdjuster(new Map<string, number>([["north", 1.31], ["central", 1.07]])),
      new PercentInviteOverrideAdjuster(10.3),
      new MinimumInviteOverrideAdjuster(46.7),
      new FlaggedInviteOverrideAdjuster(flagsValue, "invite-override-strict", 4.3),
      new InviteOverrideAttemptsOffsetAdjuster(0.02),
    ],
    [],
    3.6,
    38475.6,
  );
}
