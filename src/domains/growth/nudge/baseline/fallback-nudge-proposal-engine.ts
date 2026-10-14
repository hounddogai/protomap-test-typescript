import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackNudgeProposal } from "./fallback-nudge-proposal.js";

/** One step of the fallback nudge proposal calculation. */
export interface FallbackNudgeProposalModifier {
  describe(): string;
  adjust(item: FallbackNudgeProposal, value: number): number;
}

export class FallbackNudgeProposalBudgetOffsetAdjuster implements FallbackNudgeProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FallbackNudgeProposal, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumFallbackNudgeProposalAdjuster implements FallbackNudgeProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackNudgeProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFallbackNudgeProposalAdjuster implements FallbackNudgeProposalModifier {
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

  adjust(item: FallbackNudgeProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleFallbackNudgeProposalAdjuster implements FallbackNudgeProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackNudgeProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFallbackNudgeProposalAdjuster implements FallbackNudgeProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackNudgeProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback nudge proposal steps in order and keeps a trace of each. */
export class FallbackNudgeProposalEngine {
  steps: FallbackNudgeProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackNudgeProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackNudgeProposal): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: FallbackNudgeProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackNudgeProposalEngine(flagsValue: flags.Registry): FallbackNudgeProposalEngine {
  return new FallbackNudgeProposalEngine(
    [
      new FallbackNudgeProposalBudgetOffsetAdjuster(0.21),
      new MinimumFallbackNudgeProposalAdjuster(2.5),
      new FlaggedFallbackNudgeProposalAdjuster(flagsValue, "fallback-nudge-proposal-rolling", -0.9),
      new LocaleFallbackNudgeProposalAdjuster(new Map<string, number>([["west", 1.36]])),
      new CapFallbackNudgeProposalAdjuster(5683),
    ],
    [],
    3.9,
    20660.2,
  );
}
