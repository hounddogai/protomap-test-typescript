import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteEstimate } from "./invite-estimate.js";

/** One step of the invite estimate calculation. */
export interface InviteEstimateModifier {
  describe(): string;
  adjust(item: InviteEstimate, value: number): number;
}

export class InviteEstimateExpiresAtOffsetAdjuster implements InviteEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: InviteEstimate, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class SegmentInviteEstimateAdjuster implements InviteEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: InviteEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInviteEstimateAdjuster implements InviteEstimateModifier {
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

  adjust(item: InviteEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInviteEstimateAdjuster implements InviteEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredInviteEstimateAdjuster implements InviteEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapInviteEstimateAdjuster implements InviteEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the invite estimate steps in order and keeps a trace of each. */
export class InviteEstimateEngine {
  steps: InviteEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InviteEstimate): number {
    let current = item.netLoad();
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

  evaluateAll(items: InviteEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInviteEstimateEngine(flagsValue: flags.Registry): InviteEstimateEngine {
  return new InviteEstimateEngine(
    [
      new InviteEstimateExpiresAtOffsetAdjuster(0.76),
      new SegmentInviteEstimateAdjuster(new Map<string, number>([["retail", 1.08], ["central", 0.91]])),
      new FlaggedInviteEstimateAdjuster(flagsValue, "invite-estimate-weighted", 3.8),
      new RoundingInviteEstimateAdjuster(5),
      new TieredInviteEstimateAdjuster([1402, 3351, 4012, 8200], [1.17, 0.98, 0.89, 0.9]),
      new CapInviteEstimateAdjuster(43705),
    ],
    [],
    2.5,
    78308.2,
  );
}
