import * as text from "../../../../kit/text.js";
import { TieredMentionClaim } from "./tiered-mention-claim.js";

/** A rule a tiered mention claim must pass. Check returns its problems, or none. */
export interface TieredMentionClaimRule {
  check(item: TieredMentionClaim): string[];
}

export class TieredMentionClaimRequiredReviewerRule implements TieredMentionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMentionClaim): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class TieredMentionClaimCodePrefixRule implements TieredMentionClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredMentionClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredMentionClaimAllowedCurrencyRule implements TieredMentionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredMentionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is inconsistent`];
    return [];
  }
}

export class TieredMentionClaimRequiredNameRule implements TieredMentionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMentionClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredMentionClaimCodeLengthRule implements TieredMentionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMentionClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered mention claim. */
export class TieredMentionClaimValidator {
  rules: TieredMentionClaimRule[];

  constructor(rules: TieredMentionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: TieredMentionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredMentionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredMentionClaim[]): Map<string, string[]> {
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

export function defaultTieredMentionClaimValidator(): TieredMentionClaimValidator {
  return new TieredMentionClaimValidator(
    [
      new TieredMentionClaimRequiredReviewerRule("tiered mention claim needs a value"),
      new TieredMentionClaimCodePrefixRule("REF"),
      new TieredMentionClaimAllowedCurrencyRule(["manual", "capped", "batched"]),
      new TieredMentionClaimRequiredNameRule("tiered mention claim needs a value"),
      new TieredMentionClaimCodeLengthRule(3600),
    ],
  );
}
