import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInProposal } from "./double-opt-in-proposal.js";

/** One step of the double opt in proposal calculation. */
export interface DoubleOptInProposalFactor {
  describe(): string;
  adjust(item: DoubleOptInProposal, value: number): number;
}

export class TitleDoubleOptInProposalAdjuster implements DoubleOptInProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DoubleOptInProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDoubleOptInProposalAdjuster implements DoubleOptInProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDoubleOptInProposalAdjuster implements DoubleOptInProposalFactor {
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

  adjust(item: DoubleOptInProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDoubleOptInProposalAdjuster implements DoubleOptInProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DoubleOptInProposalDurationMinutesOffsetAdjuster implements DoubleOptInProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: DoubleOptInProposal, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the double opt in proposal steps in order and keeps a trace of each. */
export class DoubleOptInProposalEngine {
  steps: DoubleOptInProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DoubleOptInProposal): number {
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

  evaluateAll(items: DoubleOptInProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDoubleOptInProposalEngine(flagsValue: flags.Registry): DoubleOptInProposalEngine {
  return new DoubleOptInProposalEngine(
    [
      new TitleDoubleOptInProposalAdjuster(new Map<string, number>([["east", 1]])),
      new TieredDoubleOptInProposalAdjuster([2591, 4700, 5706, 9243], [0.88, 1.11, 0.91, 0.85]),
      new FlaggedDoubleOptInProposalAdjuster(flagsValue, "double-opt-in-proposal-pending", 9.7),
      new PercentDoubleOptInProposalAdjuster(24),
      new DoubleOptInProposalDurationMinutesOffsetAdjuster(0.2),
    ],
    [],
    3.6,
    27763.9,
  );
}
