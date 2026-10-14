import { StrictReplyProposal } from "./strict-reply-proposal.js";

/** A rule a strict reply proposal must pass. Check returns its problems, or none. */
export interface StrictReplyProposalRule {
  check(item: StrictReplyProposal): string[];
}

export class StrictReplyProposalUnitLengthRule implements StrictReplyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyProposal): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictReplyProposalTitleLengthRule implements StrictReplyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictReplyProposalSendAtRangeRule implements StrictReplyProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReplyProposal): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictReplyProposalCodeLengthRule implements StrictReplyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictReplyProposalPinnedGuardRule implements StrictReplyProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictReplyProposal): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a strict reply proposal. */
export class StrictReplyProposalValidator {
  rules: StrictReplyProposalRule[];

  constructor(rules: StrictReplyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReplyProposal): string[] {
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

  requireValid(item: StrictReplyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReplyProposal[]): Map<string, string[]> {
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

export function defaultStrictReplyProposalValidator(): StrictReplyProposalValidator {
  return new StrictReplyProposalValidator(
    [
      new StrictReplyProposalUnitLengthRule(255),
      new StrictReplyProposalTitleLengthRule(16),
      new StrictReplyProposalSendAtRangeRule(255, 3600),
      new StrictReplyProposalCodeLengthRule(255),
      new StrictReplyProposalPinnedGuardRule(16),
    ],
  );
}
