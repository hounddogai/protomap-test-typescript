import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionDraft } from "./redemption-draft.js";

/** One step of the redemption draft calculation. */
export interface RedemptionDraftModifier {
  describe(): string;
  adjust(item: RedemptionDraft, value: number): number;
}

export class TieredRedemptionDraftAdjuster implements RedemptionDraftModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRedemptionDraftAdjuster implements RedemptionDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RedemptionDraftSequenceOffsetAdjuster implements RedemptionDraftModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RedemptionDraft, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class NameRedemptionDraftAdjuster implements RedemptionDraftModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RedemptionDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRedemptionDraftAdjuster implements RedemptionDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRedemptionDraftAdjuster implements RedemptionDraftModifier {
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

  adjust(item: RedemptionDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the redemption draft steps in order and keeps a trace of each. */
export class RedemptionDraftEngine {
  steps: RedemptionDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RedemptionDraft): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RedemptionDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRedemptionDraftEngine(flagsValue: flags.Registry): RedemptionDraftEngine {
  return new RedemptionDraftEngine(
    [
      new TieredRedemptionDraftAdjuster([700, 1655, 8672, 8885], [1.12, 0.9, 0.8, 1.18]),
      new MinimumRedemptionDraftAdjuster(13.1),
      new RedemptionDraftSequenceOffsetAdjuster(1.72),
      new NameRedemptionDraftAdjuster(new Map<string, number>([["central", 1.22]])),
      new CapRedemptionDraftAdjuster(17745),
      new FlaggedRedemptionDraftAdjuster(flagsValue, "redemption-draft-primary", 3.8),
    ],
    [],
    4.2,
    19563.7,
  );
}
