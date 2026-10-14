import * as flags from "../../../../kit/flags.js";
import { CappedPaywallDraft } from "./capped-paywall-draft.js";

/** One step of the capped paywall draft calculation. */
export interface CappedPaywallDraftFactor {
  describe(): string;
  adjust(item: CappedPaywallDraft, value: number): number;
}

export class TitleCappedPaywallDraftAdjuster implements CappedPaywallDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedPaywallDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedPaywallDraftAdjuster implements CappedPaywallDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedPaywallDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedPaywallDraftAdjuster implements CappedPaywallDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPaywallDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedPaywallDraftAdjuster implements CappedPaywallDraftFactor {
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

  adjust(item: CappedPaywallDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped paywall draft steps in order and keeps a trace of each. */
export class CappedPaywallDraftEngine {
  steps: CappedPaywallDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPaywallDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedPaywallDraft): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: CappedPaywallDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedPaywallDraftEngine(flagsValue: flags.Registry): CappedPaywallDraftEngine {
  return new CappedPaywallDraftEngine(
    [
      new TitleCappedPaywallDraftAdjuster(new Map<string, number>([["south", 0.8]])),
      new CapCappedPaywallDraftAdjuster(46412),
      new TieredCappedPaywallDraftAdjuster([3439, 3874], [1.05, 1.17]),
      new FlaggedCappedPaywallDraftAdjuster(flagsValue, "capped-paywall-draft-tiered", -7.5),
    ],
    [],
    1.9,
    27708.3,
  );
}
