import { TieredReputationQuota } from "./tiered-reputation-quota.js";

/** A rule a tiered reputation quota must pass. Check returns its problems, or none. */
export interface TieredReputationQuotaRule {
  check(item: TieredReputationQuota): string[];
}

export class TieredReputationQuotaRequiredCountryRule implements TieredReputationQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredReputationQuota): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class TieredReputationQuotaTitleLengthRule implements TieredReputationQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReputationQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReputationQuotaCodeLengthRule implements TieredReputationQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReputationQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReputationQuotaExpiresAtRangeRule implements TieredReputationQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredReputationQuota): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredReputationQuotaCountryLengthRule implements TieredReputationQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReputationQuota): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReputationQuotaCodePrefixRule implements TieredReputationQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredReputationQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered reputation quota. */
export class TieredReputationQuotaValidator {
  rules: TieredReputationQuotaRule[];

  constructor(rules: TieredReputationQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TieredReputationQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredReputationQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredReputationQuota[]): Map<string, string[]> {
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

export function defaultTieredReputationQuotaValidator(): TieredReputationQuotaValidator {
  return new TieredReputationQuotaValidator(
    [
      new TieredReputationQuotaRequiredCountryRule("tiered reputation quota needs a value"),
      new TieredReputationQuotaTitleLengthRule(80),
      new TieredReputationQuotaCodeLengthRule(1000),
      new TieredReputationQuotaExpiresAtRangeRule(64, 120),
      new TieredReputationQuotaCountryLengthRule(86400),
      new TieredReputationQuotaCodePrefixRule("REF"),
    ],
  );
}
