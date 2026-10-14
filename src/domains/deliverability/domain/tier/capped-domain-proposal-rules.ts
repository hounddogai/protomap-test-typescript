import { CappedDomainProposal } from "./capped-domain-proposal.js";

/** A rule a capped domain proposal must pass. Check returns its problems, or none. */
export interface CappedDomainProposalRule {
  check(item: CappedDomainProposal): string[];
}

export class CappedDomainProposalDescriptionLengthRule implements CappedDomainProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainProposal): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainProposalCodeLengthRule implements CappedDomainProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainProposalCodePrefixRule implements CappedDomainProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedDomainProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedDomainProposalChannelLengthRule implements CappedDomainProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainProposal): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainProposalRequiredTitleRule implements CappedDomainProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDomainProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped domain proposal. */
export class CappedDomainProposalValidator {
  rules: CappedDomainProposalRule[];

  constructor(rules: CappedDomainProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDomainProposal): string[] {
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

  requireValid(item: CappedDomainProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDomainProposal[]): Map<string, string[]> {
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

export function defaultCappedDomainProposalValidator(): CappedDomainProposalValidator {
  return new CappedDomainProposalValidator(
    [
      new CappedDomainProposalDescriptionLengthRule(1000),
      new CappedDomainProposalCodeLengthRule(32),
      new CappedDomainProposalCodePrefixRule("ACM"),
      new CappedDomainProposalChannelLengthRule(80),
      new CappedDomainProposalRequiredTitleRule("capped domain proposal needs this field"),
    ],
  );
}
