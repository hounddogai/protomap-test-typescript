import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteBundle } from "./invite-bundle.js";

/** One step of the invite bundle calculation. */
export interface InviteBundleAdjuster {
  describe(): string;
  adjust(item: InviteBundle, value: number): number;
}

export class RoundingInviteBundleAdjuster implements InviteBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedInviteBundleAdjuster implements InviteBundleAdjuster {
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

  adjust(item: InviteBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapInviteBundleAdjuster implements InviteBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class InviteBundleMarginOffsetAdjuster implements InviteBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: InviteBundle, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class TieredInviteBundleAdjuster implements InviteBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the invite bundle steps in order and keeps a trace of each. */
export class InviteBundleEngine {
  steps: InviteBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InviteBundle): number {
    let current = item.netExposure();
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

  evaluateAll(items: InviteBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInviteBundleEngine(flagsValue: flags.Registry): InviteBundleEngine {
  return new InviteBundleEngine(
    [
      new RoundingInviteBundleAdjuster(0.25),
      new FlaggedInviteBundleAdjuster(flagsValue, "invite-bundle-batched", 4.9),
      new CapInviteBundleAdjuster(14899),
      new InviteBundleMarginOffsetAdjuster(1.02),
      new TieredInviteBundleAdjuster([5643, 6503], [1.01, 0.95]),
    ],
    [],
    3.5,
    27747.2,
  );
}
