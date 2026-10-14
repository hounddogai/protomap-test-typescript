import * as flags from "../../../../kit/flags.js";
import { EnrollmentProposal } from "./enrollment-proposal.js";

/** One step of the enrollment proposal calculation. */
export interface EnrollmentProposalModifier {
  describe(): string;
  adjust(item: EnrollmentProposal, value: number): number;
}

export class PercentEnrollmentProposalAdjuster implements EnrollmentProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumEnrollmentProposalAdjuster implements EnrollmentProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedEnrollmentProposalAdjuster implements EnrollmentProposalModifier {
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

  adjust(item: EnrollmentProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment proposal steps in order and keeps a trace of each. */
export class EnrollmentProposalEngine {
  steps: EnrollmentProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EnrollmentProposal): number {
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

  evaluateAll(items: EnrollmentProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEnrollmentProposalEngine(flagsValue: flags.Registry): EnrollmentProposalEngine {
  return new EnrollmentProposalEngine(
    [
      new PercentEnrollmentProposalAdjuster(-20.9),
      new MinimumEnrollmentProposalAdjuster(39),
      new FlaggedEnrollmentProposalAdjuster(flagsValue, "enrollment-proposal-legacy", -2.1),
    ],
    [],
    1.7,
    67159.3,
  );
}
