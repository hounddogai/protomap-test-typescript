import * as text from "../../../../kit/text.js";
import { FrequencyProposal } from "./frequency-proposal.js";

/** A rule a frequency proposal must pass. Check returns its problems, or none. */
export interface FrequencyProposalRule {
  check(item: FrequencyProposal): string[];
}

export class FrequencyProposalBudgetRangeRule implements FrequencyProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyProposal): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyProposalAllowedChannelRule implements FrequencyProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

export class FrequencyProposalRequiredNameRule implements FrequencyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyProposalRequiredCodeRule implements FrequencyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyProposalChannelLengthRule implements FrequencyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyProposal): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyProposalRequiredChannelRule implements FrequencyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyProposal): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency proposal. */
export class FrequencyProposalValidator {
  rules: FrequencyProposalRule[];

  constructor(rules: FrequencyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyProposal[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultFrequencyProposalValidator(): FrequencyProposalValidator {
  return new FrequencyProposalValidator(
    [
      new FrequencyProposalBudgetRangeRule(5.2, 4985),
      new FrequencyProposalAllowedChannelRule(["rolling", "tiered"]),
      new FrequencyProposalRequiredNameRule("frequency proposal needs a value"),
      new FrequencyProposalRequiredCodeRule("frequency proposal needs this field"),
      new FrequencyProposalChannelLengthRule(1000),
      new FrequencyProposalRequiredChannelRule("frequency proposal needs an entry"),
    ],
  );
}
