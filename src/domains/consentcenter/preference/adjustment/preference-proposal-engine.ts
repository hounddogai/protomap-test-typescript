import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceProposal } from "./preference-proposal.js";

/** One step of the preference proposal calculation. */
export interface PreferenceProposalModifier {
  describe(): string;
  adjust(item: PreferenceProposal, value: number): number;
}

export class FlaggedPreferenceProposalAdjuster implements PreferenceProposalModifier {
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

  adjust(item: PreferenceProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPreferenceProposalAdjuster implements PreferenceProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPreferenceProposalAdjuster implements PreferenceProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPreferenceProposalAdjuster implements PreferenceProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PreferenceProposalExpiresAtOffsetAdjuster implements PreferenceProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: PreferenceProposal, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the preference proposal steps in order and keeps a trace of each. */
export class PreferenceProposalEngine {
  steps: PreferenceProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PreferenceProposal): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PreferenceProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPreferenceProposalEngine(flagsValue: flags.Registry): PreferenceProposalEngine {
  return new PreferenceProposalEngine(
    [
      new FlaggedPreferenceProposalAdjuster(flagsValue, "preference-proposal-batched", -9.6),
      new RoundingPreferenceProposalAdjuster(0.25),
      new TieredPreferenceProposalAdjuster([2568, 3975, 9344], [1.03, 0.97, 1.09]),
      new CapPreferenceProposalAdjuster(37191),
      new PreferenceProposalExpiresAtOffsetAdjuster(0.99),
    ],
    [],
    4.1,
    49368.2,
  );
}
