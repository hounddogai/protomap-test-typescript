import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultJourneyProposal } from "./default-journey-proposal.js";

/** One step of the default journey proposal calculation. */
export interface DefaultJourneyProposalStep {
  describe(): string;
  adjust(item: DefaultJourneyProposal, value: number): number;
}

export class CapDefaultJourneyProposalAdjuster implements DefaultJourneyProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultJourneyProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultJourneyProposalAdjuster implements DefaultJourneyProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultJourneyProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentDefaultJourneyProposalAdjuster implements DefaultJourneyProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DefaultJourneyProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDefaultJourneyProposalAdjuster implements DefaultJourneyProposalStep {
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

  adjust(item: DefaultJourneyProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default journey proposal steps in order and keeps a trace of each. */
export class DefaultJourneyProposalEngine {
  steps: DefaultJourneyProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultJourneyProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultJourneyProposal): number {
    let current = item.netValue();
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

  evaluateAll(items: DefaultJourneyProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultJourneyProposalEngine(flagsValue: flags.Registry): DefaultJourneyProposalEngine {
  return new DefaultJourneyProposalEngine(
    [
      new CapDefaultJourneyProposalAdjuster(14638),
      new TieredDefaultJourneyProposalAdjuster([40, 8695], [1.16, 1.1]),
      new SegmentDefaultJourneyProposalAdjuster(new Map<string, number>([["west", 0.98]])),
      new FlaggedDefaultJourneyProposalAdjuster(flagsValue, "default-journey-proposal-pending", -0.2),
    ],
    [],
    0.8,
    27171.1,
  );
}
