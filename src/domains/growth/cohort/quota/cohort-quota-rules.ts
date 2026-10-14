import { CohortQuota } from "./cohort-quota.js";

/** A rule a cohort quota must pass. Check returns its problems, or none. */
export interface CohortQuotaRule {
  check(item: CohortQuota): string[];
}

export class CohortQuotaChecksumLengthRule implements CohortQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortQuota): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortQuotaCodePrefixRule implements CohortQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortQuotaRequiredCodeRule implements CohortQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortQuotaRequiredChecksumRule implements CohortQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortQuota): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class CohortQuotaCostRangeRule implements CohortQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortQuota): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a cohort quota. */
export class CohortQuotaValidator {
  rules: CohortQuotaRule[];

  constructor(rules: CohortQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CohortQuota): string[] {
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

  requireValid(item: CohortQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortQuota[]): Map<string, string[]> {
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

export function defaultCohortQuotaValidator(): CohortQuotaValidator {
  return new CohortQuotaValidator(
    [
      new CohortQuotaChecksumLengthRule(1000),
      new CohortQuotaCodePrefixRule("Q"),
      new CohortQuotaRequiredCodeRule("cohort quota needs this field"),
      new CohortQuotaRequiredChecksumRule("cohort quota needs a value"),
      new CohortQuotaCostRangeRule(4.3, 3058.6),
    ],
  );
}
