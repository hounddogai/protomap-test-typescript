import * as numbers from "../../../../kit/numbers.js";
import { MentionProposal } from "./mention-proposal.js";

/** One step of the mention proposal calculation. */
export interface MentionProposalModifier {
  describe(): string;
  adjust(item: MentionProposal, value: number): number;
}

export class RoundingMentionProposalAdjuster implements MentionProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredMentionProposalAdjuster implements MentionProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentMentionProposalAdjuster implements MentionProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention proposal steps in order and keeps a trace of each. */
export class MentionProposalEngine {
  steps: MentionProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionProposal): number {
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

  evaluateAll(items: MentionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionProposalEngine(): MentionProposalEngine {
  return new MentionProposalEngine(
    [
      new RoundingMentionProposalAdjuster(1),
      new TieredMentionProposalAdjuster([1317, 9171], [0.8, 0.88]),
      new PercentMentionProposalAdjuster(-10.1),
    ],
    [],
    3.3,
    41531,
  );
}
