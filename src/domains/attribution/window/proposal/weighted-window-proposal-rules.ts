import * as text from "../../../../kit/text.js";
import { WeightedWindowProposal } from "./weighted-window-proposal.js";

/** A rule a weighted window proposal must pass. Check returns its problems, or none. */
export interface WeightedWindowProposalRule {
  check(item: WeightedWindowProposal): string[];
}

export class WeightedWindowProposalAllowedTitleRule implements WeightedWindowProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedWindowProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class WeightedWindowProposalRequiredTimezoneRule implements WeightedWindowProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowProposal): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWindowProposalVersionRangeRule implements WeightedWindowProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowProposal): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWindowProposalAttemptsRangeRule implements WeightedWindowProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowProposal): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedWindowProposalTitleLengthRule implements WeightedWindowProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted window proposal. */
export class WeightedWindowProposalValidator {
  rules: WeightedWindowProposalRule[];

  constructor(rules: WeightedWindowProposalRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWindowProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWindowProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWindowProposal[]): Map<string, string[]> {
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

export function defaultWeightedWindowProposalValidator(): WeightedWindowProposalValidator {
  return new WeightedWindowProposalValidator(
    [
      new WeightedWindowProposalAllowedTitleRule(["batched"]),
      new WeightedWindowProposalRequiredTimezoneRule("weighted window proposal needs a value"),
      new WeightedWindowProposalVersionRangeRule(120, 1000),
      new WeightedWindowProposalAttemptsRangeRule(80, 120),
      new WeightedWindowProposalTitleLengthRule(80),
    ],
  );
}
