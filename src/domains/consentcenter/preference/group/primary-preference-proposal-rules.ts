import { PrimaryPreferenceProposal } from "./primary-preference-proposal.js";

/** A rule a primary preference proposal must pass. Check returns its problems, or none. */
export interface PrimaryPreferenceProposalRule {
  check(item: PrimaryPreferenceProposal): string[];
}

export class PrimaryPreferenceProposalClicksRangeRule implements PrimaryPreferenceProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPreferenceProposal): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryPreferenceProposalSummaryLengthRule implements PrimaryPreferenceProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPreferenceProposal): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPreferenceProposalRequiredNameRule implements PrimaryPreferenceProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPreferenceProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPreferenceProposalCodePrefixRule implements PrimaryPreferenceProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryPreferenceProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryPreferenceProposalDescriptionLengthRule implements PrimaryPreferenceProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPreferenceProposal): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary preference proposal. */
export class PrimaryPreferenceProposalValidator {
  rules: PrimaryPreferenceProposalRule[];

  constructor(rules: PrimaryPreferenceProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPreferenceProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPreferenceProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPreferenceProposal[]): Map<string, string[]> {
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

export function defaultPrimaryPreferenceProposalValidator(): PrimaryPreferenceProposalValidator {
  return new PrimaryPreferenceProposalValidator(
    [
      new PrimaryPreferenceProposalClicksRangeRule(64, 1000),
      new PrimaryPreferenceProposalSummaryLengthRule(86400),
      new PrimaryPreferenceProposalRequiredNameRule("primary preference proposal needs this field"),
      new PrimaryPreferenceProposalCodePrefixRule("Q"),
      new PrimaryPreferenceProposalDescriptionLengthRule(64),
    ],
  );
}
