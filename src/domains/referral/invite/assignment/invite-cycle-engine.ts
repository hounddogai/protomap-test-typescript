import * as flags from "../../../../kit/flags.js";
import { InviteCycle } from "./invite-cycle.js";

/** One step of the invite cycle calculation. */
export interface InviteCycleAdjuster {
  describe(): string;
  adjust(item: InviteCycle, value: number): number;
}

export class MinimumInviteCycleAdjuster implements InviteCycleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentInviteCycleAdjuster implements InviteCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedInviteCycleAdjuster implements InviteCycleAdjuster {
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

  adjust(item: InviteCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryInviteCycleAdjuster implements InviteCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: InviteCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapInviteCycleAdjuster implements InviteCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the invite cycle steps in order and keeps a trace of each. */
export class InviteCycleEngine {
  steps: InviteCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteCycle): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: InviteCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteCycleEngine(flagsValue: flags.Registry): InviteCycleEngine {
  return new InviteCycleEngine(
    [
      new MinimumInviteCycleAdjuster(40),
      new PercentInviteCycleAdjuster(-13),
      new FlaggedInviteCycleAdjuster(flagsValue, "invite-cycle-seasonal", 9),
      new CountryInviteCycleAdjuster(new Map<string, number>([["online", 0.91]])),
      new CapInviteCycleAdjuster(43780),
    ],
    [],
    3,
    38224.8,
  );
}
