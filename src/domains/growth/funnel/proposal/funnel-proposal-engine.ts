import * as flags from "../../../../kit/flags.js";
import { FunnelProposal } from "./funnel-proposal.js";

/** One step of the funnel proposal calculation. */
export interface FunnelProposalModifier {
  describe(): string;
  adjust(item: FunnelProposal, value: number): number;
}

export class PercentFunnelProposalAdjuster implements FunnelProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFunnelProposalAdjuster implements FunnelProposalModifier {
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

  adjust(item: FunnelProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FunnelProposalFloorValueOffsetAdjuster implements FunnelProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: FunnelProposal, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the funnel proposal steps in order and keeps a trace of each. */
export class FunnelProposalEngine {
  steps: FunnelProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FunnelProposal): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: FunnelProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFunnelProposalEngine(flagsValue: flags.Registry): FunnelProposalEngine {
  return new FunnelProposalEngine(
    [
      new PercentFunnelProposalAdjuster(10.7),
      new FlaggedFunnelProposalAdjuster(flagsValue, "funnel-proposal-batched", -2.2),
      new FunnelProposalFloorValueOffsetAdjuster(0.21),
    ],
    [],
    2.5,
    65420,
  );
}
