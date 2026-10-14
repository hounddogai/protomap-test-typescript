import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewProposal } from "./ticket-view-proposal.js";

/** One step of the ticket view proposal calculation. */
export interface TicketViewProposalAdjuster {
  describe(): string;
  adjust(item: TicketViewProposal, value: number): number;
}

export class FlaggedTicketViewProposalAdjuster implements TicketViewProposalAdjuster {
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

  adjust(item: TicketViewProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTicketViewProposalAdjuster implements TicketViewProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTicketViewProposalAdjuster implements TicketViewProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TicketViewProposalBatchSizeOffsetAdjuster implements TicketViewProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: TicketViewProposal, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingTicketViewProposalAdjuster implements TicketViewProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelTicketViewProposalAdjuster implements TicketViewProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TicketViewProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the ticket view proposal steps in order and keeps a trace of each. */
export class TicketViewProposalEngine {
  steps: TicketViewProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TicketViewProposal): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TicketViewProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTicketViewProposalEngine(flagsValue: flags.Registry): TicketViewProposalEngine {
  return new TicketViewProposalEngine(
    [
      new FlaggedTicketViewProposalAdjuster(flagsValue, "ticket-view-proposal-weighted", -9.2),
      new PercentTicketViewProposalAdjuster(-5.2),
      new TieredTicketViewProposalAdjuster([2119, 4691, 6282], [1.07, 0.85, 0.96]),
      new TicketViewProposalBatchSizeOffsetAdjuster(0.42),
      new RoundingTicketViewProposalAdjuster(0.5),
      new LabelTicketViewProposalAdjuster(new Map<string, number>([["online", 0.89]])),
    ],
    [],
    0.7,
    13570.5,
  );
}
