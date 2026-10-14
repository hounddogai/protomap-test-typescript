import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientNudgeProposal } from "./lenient-nudge-proposal.js";

/** One step of the lenient nudge proposal calculation. */
export interface LenientNudgeProposalStep {
  describe(): string;
  adjust(item: LenientNudgeProposal, value: number): number;
}

export class CapLenientNudgeProposalAdjuster implements LenientNudgeProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientNudgeProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLenientNudgeProposalAdjuster implements LenientNudgeProposalStep {
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

  adjust(item: LenientNudgeProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientNudgeProposalBudgetOffsetAdjuster implements LenientNudgeProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: LenientNudgeProposal, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredLenientNudgeProposalAdjuster implements LenientNudgeProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientNudgeProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientNudgeProposalAdjuster implements LenientNudgeProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientNudgeProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientNudgeProposalAdjuster implements LenientNudgeProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientNudgeProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient nudge proposal steps in order and keeps a trace of each. */
export class LenientNudgeProposalEngine {
  steps: LenientNudgeProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientNudgeProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientNudgeProposal): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LenientNudgeProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientNudgeProposalEngine(flagsValue: flags.Registry): LenientNudgeProposalEngine {
  return new LenientNudgeProposalEngine(
    [
      new CapLenientNudgeProposalAdjuster(32158),
      new FlaggedLenientNudgeProposalAdjuster(flagsValue, "lenient-nudge-proposal-capped", -5.2),
      new LenientNudgeProposalBudgetOffsetAdjuster(0.81),
      new TieredLenientNudgeProposalAdjuster([1274, 1891, 7035], [0.87, 1.04, 0.83]),
      new PercentLenientNudgeProposalAdjuster(-12.9),
      new MinimumLenientNudgeProposalAdjuster(29.7),
    ],
    [],
    4.4,
    81205.6,
  );
}
