import { ActivationProposal } from "./activation-proposal.js";

/** A rule a activation proposal must pass. Check returns its problems, or none. */
export interface ActivationProposalRule {
  check(item: ActivationProposal): string[];
}

export class ActivationProposalRequiredCodeRule implements ActivationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationProposalRequiredNotesRule implements ActivationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationProposal): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationProposalRateRangeRule implements ActivationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationProposal): string[] {
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

export class ActivationProposalCodeLengthRule implements ActivationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation proposal. */
export class ActivationProposalValidator {
  rules: ActivationProposalRule[];

  constructor(rules: ActivationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationProposal[]): Map<string, string[]> {
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

export function defaultActivationProposalValidator(): ActivationProposalValidator {
  return new ActivationProposalValidator(
    [
      new ActivationProposalRequiredCodeRule("activation proposal needs this field"),
      new ActivationProposalRequiredNotesRule("activation proposal needs this field"),
      new ActivationProposalRateRangeRule(2.2, 166.7),
      new ActivationProposalCodeLengthRule(32),
    ],
  );
}
