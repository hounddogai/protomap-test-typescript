import * as text from "../../../../kit/text.js";
import { StrictPayoutQuota } from "./strict-payout-quota.js";

/** A rule a strict payout quota must pass. Check returns its problems, or none. */
export interface StrictPayoutQuotaRule {
  check(item: StrictPayoutQuota): string[];
}

export class StrictPayoutQuotaNotesLengthRule implements StrictPayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPayoutQuota): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPayoutQuotaAllowedTitleRule implements StrictPayoutQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPayoutQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class StrictPayoutQuotaRequiredLocaleRule implements StrictPayoutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPayoutQuota): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPayoutQuotaTitleLengthRule implements StrictPayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPayoutQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict payout quota. */
export class StrictPayoutQuotaValidator {
  rules: StrictPayoutQuotaRule[];

  constructor(rules: StrictPayoutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPayoutQuota): string[] {
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

  requireValid(item: StrictPayoutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPayoutQuota[]): Map<string, string[]> {
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

export function defaultStrictPayoutQuotaValidator(): StrictPayoutQuotaValidator {
  return new StrictPayoutQuotaValidator(
    [
      new StrictPayoutQuotaNotesLengthRule(120),
      new StrictPayoutQuotaAllowedTitleRule(["weighted", "primary", "adaptive"]),
      new StrictPayoutQuotaRequiredLocaleRule("strict payout quota needs this field"),
      new StrictPayoutQuotaTitleLengthRule(1000),
    ],
  );
}
