import * as flags from "../../../../kit/flags.js";
import { FraudCheckProposal } from "./fraud-check-proposal.js";

/** One step of the fraud check proposal calculation. */
export interface FraudCheckProposalAdjuster {
  describe(): string;
  adjust(item: FraudCheckProposal, value: number): number;
}

export class LabelFraudCheckProposalAdjuster implements FraudCheckProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FraudCheckProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFraudCheckProposalAdjuster implements FraudCheckProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFraudCheckProposalAdjuster implements FraudCheckProposalAdjuster {
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

  adjust(item: FraudCheckProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fraud check proposal steps in order and keeps a trace of each. */
export class FraudCheckProposalEngine {
  steps: FraudCheckProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FraudCheckProposal): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: FraudCheckProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFraudCheckProposalEngine(flagsValue: flags.Registry): FraudCheckProposalEngine {
  return new FraudCheckProposalEngine(
    [
      new LabelFraudCheckProposalAdjuster(new Map<string, number>([["south", 1.03], ["west", 1.28]])),
      new MinimumFraudCheckProposalAdjuster(28.2),
      new FlaggedFraudCheckProposalAdjuster(flagsValue, "fraud-check-proposal-regional", -1.1),
    ],
    [],
    1.1,
    75641.2,
  );
}
