import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientCreditProposal } from "./lenient-credit-proposal.js";

/** One step of the lenient credit proposal calculation. */
export interface LenientCreditProposalModifier {
  describe(): string;
  adjust(item: LenientCreditProposal, value: number): number;
}

export class TieredLenientCreditProposalAdjuster implements LenientCreditProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientCreditProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientCreditProposalAdjuster implements LenientCreditProposalModifier {
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

  adjust(item: LenientCreditProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientCreditProposalAdjuster implements LenientCreditProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientCreditProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentLenientCreditProposalAdjuster implements LenientCreditProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LenientCreditProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLenientCreditProposalAdjuster implements LenientCreditProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientCreditProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLenientCreditProposalAdjuster implements LenientCreditProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientCreditProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient credit proposal steps in order and keeps a trace of each. */
export class LenientCreditProposalEngine {
  steps: LenientCreditProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCreditProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientCreditProposal): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LenientCreditProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientCreditProposalEngine(flagsValue: flags.Registry): LenientCreditProposalEngine {
  return new LenientCreditProposalEngine(
    [
      new TieredLenientCreditProposalAdjuster([3517, 8155, 8875, 9995], [0.82, 0.97, 1.02, 1.05]),
      new FlaggedLenientCreditProposalAdjuster(flagsValue, "lenient-credit-proposal-fallback", 8),
      new RoundingLenientCreditProposalAdjuster(1),
      new SegmentLenientCreditProposalAdjuster(new Map<string, number>([["retail", 1.26]])),
      new CapLenientCreditProposalAdjuster(48601),
      new PercentLenientCreditProposalAdjuster(-22.3),
    ],
    [],
    2,
    70084,
  );
}
