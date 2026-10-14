import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingFrequencyProposal } from "./pending-frequency-proposal.js";

/** One step of the pending frequency proposal calculation. */
export interface PendingFrequencyProposalAdjuster {
  describe(): string;
  adjust(item: PendingFrequencyProposal, value: number): number;
}

export class TieredPendingFrequencyProposalAdjuster implements PendingFrequencyProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingFrequencyProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelPendingFrequencyProposalAdjuster implements PendingFrequencyProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingFrequencyProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingFrequencyProposalAdjuster implements PendingFrequencyProposalAdjuster {
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

  adjust(item: PendingFrequencyProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingFrequencyProposalAdjuster implements PendingFrequencyProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingFrequencyProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PendingFrequencyProposalSendAtOffsetAdjuster implements PendingFrequencyProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: PendingFrequencyProposal, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingPendingFrequencyProposalAdjuster implements PendingFrequencyProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingFrequencyProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending frequency proposal steps in order and keeps a trace of each. */
export class PendingFrequencyProposalEngine {
  steps: PendingFrequencyProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingFrequencyProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingFrequencyProposal): number {
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

  evaluateAll(items: PendingFrequencyProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingFrequencyProposalEngine(flagsValue: flags.Registry): PendingFrequencyProposalEngine {
  return new PendingFrequencyProposalEngine(
    [
      new TieredPendingFrequencyProposalAdjuster([483, 3177, 9404], [1.11, 0.9, 0.95]),
      new ChannelPendingFrequencyProposalAdjuster(new Map<string, number>([["central", 0.73]])),
      new FlaggedPendingFrequencyProposalAdjuster(flagsValue, "pending-frequency-proposal-strict", 2.1),
      new CapPendingFrequencyProposalAdjuster(28187),
      new PendingFrequencyProposalSendAtOffsetAdjuster(1.02),
      new RoundingPendingFrequencyProposalAdjuster(0.25),
    ],
    [],
    3.7,
    55238.4,
  );
}
