import { CappedFraudCheckProposal } from "./capped-fraud-check-proposal.js";

/** A rule a capped fraud check proposal must pass. Check returns its problems, or none. */
export interface CappedFraudCheckProposalRule {
  check(item: CappedFraudCheckProposal): string[];
}

export class CappedFraudCheckProposalNameLengthRule implements CappedFraudCheckProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFraudCheckProposalCodePrefixRule implements CappedFraudCheckProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedFraudCheckProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedFraudCheckProposalCodeLengthRule implements CappedFraudCheckProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped fraud check proposal. */
export class CappedFraudCheckProposalValidator {
  rules: CappedFraudCheckProposalRule[];

  constructor(rules: CappedFraudCheckProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFraudCheckProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedFraudCheckProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFraudCheckProposal[]): Map<string, string[]> {
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

export function defaultCappedFraudCheckProposalValidator(): CappedFraudCheckProposalValidator {
  return new CappedFraudCheckProposalValidator(
    [
      new CappedFraudCheckProposalNameLengthRule(32),
      new CappedFraudCheckProposalCodePrefixRule("OPS"),
      new CappedFraudCheckProposalCodeLengthRule(64),
    ],
  );
}
