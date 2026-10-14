import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaProposal } from "./sla-proposal.js";

/** One step of the sla proposal calculation. */
export interface SlaProposalFactor {
  describe(): string;
  adjust(item: SlaProposal, value: number): number;
}

export class FlaggedSlaProposalAdjuster implements SlaProposalFactor {
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

  adjust(item: SlaProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSlaProposalAdjuster implements SlaProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleSlaProposalAdjuster implements SlaProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SlaProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SlaProposalCreatedAtOffsetAdjuster implements SlaProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: SlaProposal, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the sla proposal steps in order and keeps a trace of each. */
export class SlaProposalEngine {
  steps: SlaProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SlaProposal): number {
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

  evaluateAll(items: SlaProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSlaProposalEngine(flagsValue: flags.Registry): SlaProposalEngine {
  return new SlaProposalEngine(
    [
      new FlaggedSlaProposalAdjuster(flagsValue, "sla-proposal-tiered", 6.1),
      new TieredSlaProposalAdjuster([1709, 4856, 8569, 9515], [1.04, 0.92, 1.2, 1.18]),
      new LocaleSlaProposalAdjuster(new Map<string, number>([["south", 1.08]])),
      new SlaProposalCreatedAtOffsetAdjuster(0.55),
    ],
    [],
    2.7,
    50516.6,
  );
}
