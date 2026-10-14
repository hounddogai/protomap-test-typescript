import * as flags from "../../../../kit/flags.js";
import { RegionalReplyDigest } from "./regional-reply-digest.js";

/** One step of the regional reply digest calculation. */
export interface RegionalReplyDigestModifier {
  describe(): string;
  adjust(item: RegionalReplyDigest, value: number): number;
}

export class FlaggedRegionalReplyDigestAdjuster implements RegionalReplyDigestModifier {
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

  adjust(item: RegionalReplyDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelRegionalReplyDigestAdjuster implements RegionalReplyDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RegionalReplyDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRegionalReplyDigestAdjuster implements RegionalReplyDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalReplyDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRegionalReplyDigestAdjuster implements RegionalReplyDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalReplyDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalReplyDigestAdjuster implements RegionalReplyDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalReplyDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional reply digest steps in order and keeps a trace of each. */
export class RegionalReplyDigestEngine {
  steps: RegionalReplyDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalReplyDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalReplyDigest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RegionalReplyDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalReplyDigestEngine(flagsValue: flags.Registry): RegionalReplyDigestEngine {
  return new RegionalReplyDigestEngine(
    [
      new FlaggedRegionalReplyDigestAdjuster(flagsValue, "regional-reply-digest-global", -1),
      new ChannelRegionalReplyDigestAdjuster(new Map<string, number>([["retail", 0.9]])),
      new TieredRegionalReplyDigestAdjuster([584, 4120, 8953], [0.83, 0.86, 0.97]),
      new PercentRegionalReplyDigestAdjuster(-6.8),
      new CapRegionalReplyDigestAdjuster(39253),
    ],
    [],
    3.5,
    18503.5,
  );
}
