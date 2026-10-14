import { RollingOptOutProposal } from "./rolling-opt-out-proposal.js";

/** A rule a rolling opt out proposal must pass. Check returns its problems, or none. */
export interface RollingOptOutProposalRule {
  check(item: RollingOptOutProposal): string[];
}

export class RollingOptOutProposalRequiredVariantRule implements RollingOptOutProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutProposal): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutProposalRequiredSegmentRule implements RollingOptOutProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutProposal): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutProposalCodePrefixRule implements RollingOptOutProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingOptOutProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingOptOutProposalSegmentLengthRule implements RollingOptOutProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutProposal): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutProposalTitleLengthRule implements RollingOptOutProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutProposalCodeLengthRule implements RollingOptOutProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling opt out proposal. */
export class RollingOptOutProposalValidator {
  rules: RollingOptOutProposalRule[];

  constructor(rules: RollingOptOutProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RollingOptOutProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingOptOutProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingOptOutProposal[]): Map<string, string[]> {
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

export function defaultRollingOptOutProposalValidator(): RollingOptOutProposalValidator {
  return new RollingOptOutProposalValidator(
    [
      new RollingOptOutProposalRequiredVariantRule("rolling opt out proposal needs an entry"),
      new RollingOptOutProposalRequiredSegmentRule("rolling opt out proposal needs this field"),
      new RollingOptOutProposalCodePrefixRule("Q"),
      new RollingOptOutProposalSegmentLengthRule(64),
      new RollingOptOutProposalTitleLengthRule(255),
      new RollingOptOutProposalCodeLengthRule(16),
    ],
  );
}
