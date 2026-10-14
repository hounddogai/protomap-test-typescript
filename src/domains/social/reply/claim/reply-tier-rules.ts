import * as text from "../../../../kit/text.js";
import { ReplyTier } from "./reply-tier.js";

/** A rule a reply tier must pass. Check returns its problems, or none. */
export interface ReplyTierRule {
  check(item: ReplyTier): string[];
}

export class ReplyTierRequiredTitleRule implements ReplyTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyTierAllowedExternalRefRule implements ReplyTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is expired`];
    return [];
  }
}

export class ReplyTierActiveGuardRule implements ReplyTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplyTier): string[] {
    if (item.active && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a reply tier. */
export class ReplyTierValidator {
  rules: ReplyTierRule[];

  constructor(rules: ReplyTierRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyTier): string[] {
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

  requireValid(item: ReplyTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyTier[]): Map<string, string[]> {
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

export function defaultReplyTierValidator(): ReplyTierValidator {
  return new ReplyTierValidator(
    [
      new ReplyTierRequiredTitleRule("reply tier needs this field"),
      new ReplyTierAllowedExternalRefRule(["primary", "seasonal"]),
      new ReplyTierActiveGuardRule(16),
    ],
  );
}
