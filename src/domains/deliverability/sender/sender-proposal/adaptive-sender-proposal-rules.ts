import { AdaptiveSenderProposal } from "./adaptive-sender-proposal.js";

/** A rule a adaptive sender proposal must pass. Check returns its problems, or none. */
export interface AdaptiveSenderProposalRule {
  check(item: AdaptiveSenderProposal): string[];
}

export class AdaptiveSenderProposalSummaryLengthRule implements AdaptiveSenderProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSenderProposal): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSenderProposalScoreRangeRule implements AdaptiveSenderProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSenderProposal): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveSenderProposalCodeLengthRule implements AdaptiveSenderProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSenderProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSenderProposalRequiredSummaryRule implements AdaptiveSenderProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSenderProposal): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSenderProposalRequiredCodeRule implements AdaptiveSenderProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSenderProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive sender proposal. */
export class AdaptiveSenderProposalValidator {
  rules: AdaptiveSenderProposalRule[];

  constructor(rules: AdaptiveSenderProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSenderProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveSenderProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSenderProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveSenderProposalValidator(): AdaptiveSenderProposalValidator {
  return new AdaptiveSenderProposalValidator(
    [
      new AdaptiveSenderProposalSummaryLengthRule(120),
      new AdaptiveSenderProposalScoreRangeRule(1.8, 2250.5),
      new AdaptiveSenderProposalCodeLengthRule(80),
      new AdaptiveSenderProposalRequiredSummaryRule("adaptive sender proposal needs this field"),
      new AdaptiveSenderProposalRequiredCodeRule("adaptive sender proposal needs this field"),
    ],
  );
}
