import { CsatProposal } from "./csat-proposal.js";

/** A rule a csat proposal must pass. Check returns its problems, or none. */
export interface CsatProposalRule {
  check(item: CsatProposal): string[];
}

export class CsatProposalRequiredLabelRule implements CsatProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CsatProposalCodeLengthRule implements CsatProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatProposalAttemptsRangeRule implements CsatProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatProposal): string[] {
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

export class CsatProposalCategoryLengthRule implements CsatProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatProposal): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatProposalScoreRangeRule implements CsatProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatProposal): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a csat proposal. */
export class CsatProposalValidator {
  rules: CsatProposalRule[];

  constructor(rules: CsatProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CsatProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatProposal[]): Map<string, string[]> {
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

export function defaultCsatProposalValidator(): CsatProposalValidator {
  return new CsatProposalValidator(
    [
      new CsatProposalRequiredLabelRule("csat proposal needs a value"),
      new CsatProposalCodeLengthRule(3600),
      new CsatProposalAttemptsRangeRule(32, 86400),
      new CsatProposalCategoryLengthRule(255),
      new CsatProposalScoreRangeRule(9.1, 2774.7),
    ],
  );
}
