import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightProposal } from "./insight-proposal.js";

/** One step of the insight proposal calculation. */
export interface InsightProposalModifier {
  describe(): string;
  adjust(item: InsightProposal, value: number): number;
}

export class InsightProposalBidOffsetAdjuster implements InsightProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: InsightProposal, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class PercentInsightProposalAdjuster implements InsightProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedInsightProposalAdjuster implements InsightProposalModifier {
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

  adjust(item: InsightProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInsightProposalAdjuster implements InsightProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the insight proposal steps in order and keeps a trace of each. */
export class InsightProposalEngine {
  steps: InsightProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InsightProposal): number {
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

  evaluateAll(items: InsightProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInsightProposalEngine(flagsValue: flags.Registry): InsightProposalEngine {
  return new InsightProposalEngine(
    [
      new InsightProposalBidOffsetAdjuster(0.33),
      new PercentInsightProposalAdjuster(-9.4),
      new FlaggedInsightProposalAdjuster(flagsValue, "insight-proposal-manual", -9.1),
      new MinimumInsightProposalAdjuster(22.7),
    ],
    [],
    4.1,
    78609.5,
  );
}
