import { SlaProposal } from "./sla-proposal.js";

/** A rule a sla proposal must pass. Check returns its problems, or none. */
export interface SlaProposalRule {
  check(item: SlaProposal): string[];
}

export class SlaProposalExternalRefLengthRule implements SlaProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaProposal): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaProposalRequiredExternalRefRule implements SlaProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaProposal): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class SlaProposalContactEmailLengthRule implements SlaProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaProposal): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaProposalWindowDaysRangeRule implements SlaProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaProposal): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaProposalCodePrefixRule implements SlaProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a sla proposal. */
export class SlaProposalValidator {
  rules: SlaProposalRule[];

  constructor(rules: SlaProposalRule[]) {
    this.rules = rules;
  }

  validate(item: SlaProposal): string[] {
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

  requireValid(item: SlaProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaProposal[]): Map<string, string[]> {
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

export function defaultSlaProposalValidator(): SlaProposalValidator {
  return new SlaProposalValidator(
    [
      new SlaProposalExternalRefLengthRule(255),
      new SlaProposalRequiredExternalRefRule("sla proposal needs a value"),
      new SlaProposalContactEmailLengthRule(16),
      new SlaProposalWindowDaysRangeRule(16, 86400),
      new SlaProposalCodePrefixRule("Q"),
    ],
  );
}
