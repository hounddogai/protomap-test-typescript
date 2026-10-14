import { CappedPayoutQuota } from "./capped-payout-quota.js";

/** A rule a capped payout quota must pass. Check returns its problems, or none. */
export interface CappedPayoutQuotaRule {
  check(item: CappedPayoutQuota): string[];
}

export class CappedPayoutQuotaSequenceRangeRule implements CappedPayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPayoutQuota): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedPayoutQuotaCodePrefixRule implements CappedPayoutQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPayoutQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPayoutQuotaRequiredSegmentRule implements CappedPayoutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPayoutQuota): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPayoutQuotaRequiredNameRule implements CappedPayoutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPayoutQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped payout quota. */
export class CappedPayoutQuotaValidator {
  rules: CappedPayoutQuotaRule[];

  constructor(rules: CappedPayoutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPayoutQuota): string[] {
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

  requireValid(item: CappedPayoutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPayoutQuota[]): Map<string, string[]> {
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

export function defaultCappedPayoutQuotaValidator(): CappedPayoutQuotaValidator {
  return new CappedPayoutQuotaValidator(
    [
      new CappedPayoutQuotaSequenceRangeRule(120, 255),
      new CappedPayoutQuotaCodePrefixRule("ACM"),
      new CappedPayoutQuotaRequiredSegmentRule("capped payout quota needs an entry"),
      new CappedPayoutQuotaRequiredNameRule("capped payout quota needs this field"),
    ],
  );
}
