import { AdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

/** A rule a adaptive activation proposal must pass. Check returns its problems, or none. */
export interface AdaptiveActivationProposalRule {
  check(item: AdaptiveActivationProposal): string[];
}

export class AdaptiveActivationProposalRequiredCodeRule implements AdaptiveActivationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveActivationProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveActivationProposalBudgetRangeRule implements AdaptiveActivationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveActivationProposal): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveActivationProposalOwnerIdLengthRule implements AdaptiveActivationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveActivationProposal): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveActivationProposalLabelLengthRule implements AdaptiveActivationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveActivationProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive activation proposal. */
export class AdaptiveActivationProposalValidator {
  rules: AdaptiveActivationProposalRule[];

  constructor(rules: AdaptiveActivationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveActivationProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveActivationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveActivationProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveActivationProposalValidator(): AdaptiveActivationProposalValidator {
  return new AdaptiveActivationProposalValidator(
    [
      new AdaptiveActivationProposalRequiredCodeRule("adaptive activation proposal needs this field"),
      new AdaptiveActivationProposalBudgetRangeRule(8.5, 3732.5),
      new AdaptiveActivationProposalOwnerIdLengthRule(16),
      new AdaptiveActivationProposalLabelLengthRule(120),
    ],
  );
}
