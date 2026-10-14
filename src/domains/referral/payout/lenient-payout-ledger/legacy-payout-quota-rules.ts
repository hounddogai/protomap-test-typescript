import { LegacyPayoutQuota } from "./legacy-payout-quota.js";

/** A rule a legacy payout quota must pass. Check returns its problems, or none. */
export interface LegacyPayoutQuotaRule {
  check(item: LegacyPayoutQuota): string[];
}

export class LegacyPayoutQuotaPinnedGuardRule implements LegacyPayoutQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyPayoutQuota): string[] {
    if (item.pinned && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacyPayoutQuotaTitleLengthRule implements LegacyPayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutQuotaCodeLengthRule implements LegacyPayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutQuotaRequiredTitleRule implements LegacyPayoutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy payout quota. */
export class LegacyPayoutQuotaValidator {
  rules: LegacyPayoutQuotaRule[];

  constructor(rules: LegacyPayoutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPayoutQuota): string[] {
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

  requireValid(item: LegacyPayoutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPayoutQuota[]): Map<string, string[]> {
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

export function defaultLegacyPayoutQuotaValidator(): LegacyPayoutQuotaValidator {
  return new LegacyPayoutQuotaValidator(
    [
      new LegacyPayoutQuotaPinnedGuardRule(32),
      new LegacyPayoutQuotaTitleLengthRule(16),
      new LegacyPayoutQuotaCodeLengthRule(32),
      new LegacyPayoutQuotaRequiredTitleRule("legacy payout quota needs this field"),
    ],
  );
}
