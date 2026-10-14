import * as text from "../../../../kit/text.js";
import { StepProposal } from "./step-proposal.js";

/** A rule a step proposal must pass. Check returns its problems, or none. */
export interface StepProposalRule {
  check(item: StepProposal): string[];
}

export class StepProposalAllowedReviewerRule implements StepProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is unknown`];
    return [];
  }
}

export class StepProposalReviewerLengthRule implements StepProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepProposal): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepProposalTitleLengthRule implements StepProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepProposalRateRangeRule implements StepProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepProposal): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepProposalRequiredReviewerRule implements StepProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepProposal): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step proposal. */
export class StepProposalValidator {
  rules: StepProposalRule[];

  constructor(rules: StepProposalRule[]) {
    this.rules = rules;
  }

  validate(item: StepProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepProposal[]): Map<string, string[]> {
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

export function defaultStepProposalValidator(): StepProposalValidator {
  return new StepProposalValidator(
    [
      new StepProposalAllowedReviewerRule(["primary"]),
      new StepProposalReviewerLengthRule(255),
      new StepProposalTitleLengthRule(255),
      new StepProposalRateRangeRule(3.7, 423.7),
      new StepProposalRequiredReviewerRule("step proposal needs an entry"),
    ],
  );
}
