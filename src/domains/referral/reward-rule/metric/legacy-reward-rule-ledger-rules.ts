import * as text from "../../../../kit/text.js";
import { LegacyRewardRuleLedger } from "./legacy-reward-rule-ledger.js";

/** A rule a legacy reward rule ledger must pass. Check returns its problems, or none. */
export interface LegacyRewardRuleLedgerRule {
  check(item: LegacyRewardRuleLedger): string[];
}

export class LegacyRewardRuleLedgerCodePrefixRule implements LegacyRewardRuleLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyRewardRuleLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyRewardRuleLedgerApprovedGuardRule implements LegacyRewardRuleLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyRewardRuleLedger): string[] {
    if (item.approved && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LegacyRewardRuleLedgerCodeLengthRule implements LegacyRewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRewardRuleLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyRewardRuleLedgerAllowedCodeRule implements LegacyRewardRuleLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyRewardRuleLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class LegacyRewardRuleLedgerRequiredTitleRule implements LegacyRewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRewardRuleLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyRewardRuleLedgerTitleLengthRule implements LegacyRewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRewardRuleLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy reward rule ledger. */
export class LegacyRewardRuleLedgerValidator {
  rules: LegacyRewardRuleLedgerRule[];

  constructor(rules: LegacyRewardRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRewardRuleLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyRewardRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRewardRuleLedger[]): Map<string, string[]> {
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

export function defaultLegacyRewardRuleLedgerValidator(): LegacyRewardRuleLedgerValidator {
  return new LegacyRewardRuleLedgerValidator(
    [
      new LegacyRewardRuleLedgerCodePrefixRule("Q"),
      new LegacyRewardRuleLedgerApprovedGuardRule(7.5),
      new LegacyRewardRuleLedgerCodeLengthRule(120),
      new LegacyRewardRuleLedgerAllowedCodeRule(["default", "legacy"]),
      new LegacyRewardRuleLedgerRequiredTitleRule("legacy reward rule ledger needs an entry"),
      new LegacyRewardRuleLedgerTitleLengthRule(120),
    ],
  );
}
