import { ManualRetentionProposal } from "./manual-retention-proposal.js";

/** A rule a manual retention proposal must pass. Check returns its problems, or none. */
export interface ManualRetentionProposalRule {
  check(item: ManualRetentionProposal): string[];
}

export class ManualRetentionProposalRequiredCodeRule implements ManualRetentionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRetentionProposalCodeLengthRule implements ManualRetentionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionProposalCodePrefixRule implements ManualRetentionProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualRetentionProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualRetentionProposalRequiredTitleRule implements ManualRetentionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual retention proposal. */
export class ManualRetentionProposalValidator {
  rules: ManualRetentionProposalRule[];

  constructor(rules: ManualRetentionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRetentionProposal): string[] {
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

  requireValid(item: ManualRetentionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRetentionProposal[]): Map<string, string[]> {
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

export function defaultManualRetentionProposalValidator(): ManualRetentionProposalValidator {
  return new ManualRetentionProposalValidator(
    [
      new ManualRetentionProposalRequiredCodeRule("manual retention proposal needs this field"),
      new ManualRetentionProposalCodeLengthRule(16),
      new ManualRetentionProposalCodePrefixRule("X"),
      new ManualRetentionProposalRequiredTitleRule("manual retention proposal needs this field"),
    ],
  );
}
