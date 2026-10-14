import { StrictStepProposal } from "./strict-step-proposal.js";

/** A rule a strict step proposal must pass. Check returns its problems, or none. */
export interface StrictStepProposalRule {
  check(item: StrictStepProposal): string[];
}

export class StrictStepProposalRequiredTitleRule implements StrictStepProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictStepProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictStepProposalRequiredVariantRule implements StrictStepProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictStepProposal): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class StrictStepProposalRequiredTimezoneRule implements StrictStepProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictStepProposal): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class StrictStepProposalAttemptsRangeRule implements StrictStepProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictStepProposal): string[] {
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

/** Runs every rule of a strict step proposal. */
export class StrictStepProposalValidator {
  rules: StrictStepProposalRule[];

  constructor(rules: StrictStepProposalRule[]) {
    this.rules = rules;
  }

  validate(item: StrictStepProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictStepProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictStepProposal[]): Map<string, string[]> {
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

export function defaultStrictStepProposalValidator(): StrictStepProposalValidator {
  return new StrictStepProposalValidator(
    [
      new StrictStepProposalRequiredTitleRule("strict step proposal needs an entry"),
      new StrictStepProposalRequiredVariantRule("strict step proposal needs this field"),
      new StrictStepProposalRequiredTimezoneRule("strict step proposal needs this field"),
      new StrictStepProposalAttemptsRangeRule(64, 80),
    ],
  );
}
