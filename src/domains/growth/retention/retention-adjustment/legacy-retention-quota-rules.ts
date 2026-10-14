import { LegacyRetentionQuota } from "./legacy-retention-quota.js";

/** A rule a legacy retention quota must pass. Check returns its problems, or none. */
export interface LegacyRetentionQuotaRule {
  check(item: LegacyRetentionQuota): string[];
}

export class LegacyRetentionQuotaBidRangeRule implements LegacyRetentionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRetentionQuota): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyRetentionQuotaRequiredJourneyIdRule implements LegacyRetentionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRetentionQuota): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyRetentionQuotaCodePrefixRule implements LegacyRetentionQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyRetentionQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyRetentionQuotaDiscountRangeRule implements LegacyRetentionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRetentionQuota): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyRetentionQuotaRequiredCodeRule implements LegacyRetentionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRetentionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyRetentionQuotaDescriptionLengthRule implements LegacyRetentionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRetentionQuota): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy retention quota. */
export class LegacyRetentionQuotaValidator {
  rules: LegacyRetentionQuotaRule[];

  constructor(rules: LegacyRetentionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRetentionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyRetentionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRetentionQuota[]): Map<string, string[]> {
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

export function defaultLegacyRetentionQuotaValidator(): LegacyRetentionQuotaValidator {
  return new LegacyRetentionQuotaValidator(
    [
      new LegacyRetentionQuotaBidRangeRule(0.4, 4295.8),
      new LegacyRetentionQuotaRequiredJourneyIdRule("legacy retention quota needs an entry"),
      new LegacyRetentionQuotaCodePrefixRule("X"),
      new LegacyRetentionQuotaDiscountRangeRule(6.9, 2681.5),
      new LegacyRetentionQuotaRequiredCodeRule("legacy retention quota needs this field"),
      new LegacyRetentionQuotaDescriptionLengthRule(255),
    ],
  );
}
