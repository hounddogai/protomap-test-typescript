import { LenientFunnelProposal } from "./lenient-funnel-proposal.js";

/** A rule a lenient funnel proposal must pass. Check returns its problems, or none. */
export interface LenientFunnelProposalRule {
  check(item: LenientFunnelProposal): string[];
}

export class LenientFunnelProposalCodeLengthRule implements LenientFunnelProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFunnelProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFunnelProposalRequiredCodeRule implements LenientFunnelProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFunnelProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFunnelProposalApprovedGuardRule implements LenientFunnelProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientFunnelProposal): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LenientFunnelProposalCodePrefixRule implements LenientFunnelProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientFunnelProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientFunnelProposalUtmSourceLengthRule implements LenientFunnelProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFunnelProposal): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFunnelProposalChannelLengthRule implements LenientFunnelProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFunnelProposal): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient funnel proposal. */
export class LenientFunnelProposalValidator {
  rules: LenientFunnelProposalRule[];

  constructor(rules: LenientFunnelProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFunnelProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFunnelProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFunnelProposal[]): Map<string, string[]> {
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

export function defaultLenientFunnelProposalValidator(): LenientFunnelProposalValidator {
  return new LenientFunnelProposalValidator(
    [
      new LenientFunnelProposalCodeLengthRule(80),
      new LenientFunnelProposalRequiredCodeRule("lenient funnel proposal needs this field"),
      new LenientFunnelProposalApprovedGuardRule(5.9),
      new LenientFunnelProposalCodePrefixRule("Q"),
      new LenientFunnelProposalUtmSourceLengthRule(255),
      new LenientFunnelProposalChannelLengthRule(120),
    ],
  );
}
