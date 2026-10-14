import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupProposal } from "./warmup-proposal.js";

/** One step of the warmup proposal calculation. */
export interface WarmupProposalStep {
  describe(): string;
  adjust(item: WarmupProposal, value: number): number;
}

export class MinimumWarmupProposalAdjuster implements WarmupProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWarmupProposalAdjuster implements WarmupProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWarmupProposalAdjuster implements WarmupProposalStep {
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

  adjust(item: WarmupProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelWarmupProposalAdjuster implements WarmupProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WarmupProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the warmup proposal steps in order and keeps a trace of each. */
export class WarmupProposalEngine {
  steps: WarmupProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupProposal): number {
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

  evaluateAll(items: WarmupProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupProposalEngine(flagsValue: flags.Registry): WarmupProposalEngine {
  return new WarmupProposalEngine(
    [
      new MinimumWarmupProposalAdjuster(2.2),
      new TieredWarmupProposalAdjuster([998, 4167, 5574, 9251], [0.9, 1.16, 0.85, 1.14]),
      new FlaggedWarmupProposalAdjuster(flagsValue, "warmup-proposal-default", 8.7),
      new LabelWarmupProposalAdjuster(new Map<string, number>([["north", 1.3], ["south", 1.2], ["west", 0.88]])),
    ],
    [],
    0.2,
    5391,
  );
}
