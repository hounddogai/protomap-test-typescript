import * as numbers from "../../../../kit/numbers.js";
import { ManualWindowProposal } from "./manual-window-proposal.js";

/** One step of the manual window proposal calculation. */
export interface ManualWindowProposalFactor {
  describe(): string;
  adjust(item: ManualWindowProposal, value: number): number;
}

export class PercentManualWindowProposalAdjuster implements ManualWindowProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualWindowProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentManualWindowProposalAdjuster implements ManualWindowProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ManualWindowProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualWindowProposalAdjuster implements ManualWindowProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualWindowProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual window proposal steps in order and keeps a trace of each. */
export class ManualWindowProposalEngine {
  steps: ManualWindowProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualWindowProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualWindowProposal): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ManualWindowProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualWindowProposalEngine(): ManualWindowProposalEngine {
  return new ManualWindowProposalEngine(
    [
      new PercentManualWindowProposalAdjuster(0.2),
      new SegmentManualWindowProposalAdjuster(
        new Map<string, number>([["west", 1.21], ["north", 1.18], ["south", 1.08]]),
      ),
      new MinimumManualWindowProposalAdjuster(41.1),
    ],
    [],
    4.5,
    29918.3,
  );
}
