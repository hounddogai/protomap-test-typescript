import * as text from "../../../../kit/text.js";
import { ReplyProposal } from "./reply-proposal.js";

/** A rule a reply proposal must pass. Check returns its problems, or none. */
export interface ReplyProposalRule {
  check(item: ReplyProposal): string[];
}

export class ReplyProposalAllowedLocaleRule implements ReplyProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

export class ReplyProposalRequiredDescriptionRule implements ReplyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyProposal): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyProposalRequiredLocaleRule implements ReplyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyProposal): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyProposalVisibleGuardRule implements ReplyProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplyProposal): string[] {
    if (item.visible && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a reply proposal. */
export class ReplyProposalValidator {
  rules: ReplyProposalRule[];

  constructor(rules: ReplyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyProposal[]): Map<string, string[]> {
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

export function defaultReplyProposalValidator(): ReplyProposalValidator {
  return new ReplyProposalValidator(
    [
      new ReplyProposalAllowedLocaleRule(["legacy"]),
      new ReplyProposalRequiredDescriptionRule("reply proposal needs an entry"),
      new ReplyProposalRequiredLocaleRule("reply proposal needs an entry"),
      new ReplyProposalVisibleGuardRule(3.9),
    ],
  );
}
