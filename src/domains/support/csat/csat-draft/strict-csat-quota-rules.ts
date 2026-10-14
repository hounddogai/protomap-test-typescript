import { StrictCsatQuota } from "./strict-csat-quota.js";

/** A rule a strict csat quota must pass. Check returns its problems, or none. */
export interface StrictCsatQuotaRule {
  check(item: StrictCsatQuota): string[];
}

export class StrictCsatQuotaChannelLengthRule implements StrictCsatQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCsatQuota): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCsatQuotaCodePrefixRule implements StrictCsatQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictCsatQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictCsatQuotaGraceDaysRangeRule implements StrictCsatQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCsatQuota): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictCsatQuotaRequiredNameRule implements StrictCsatQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCsatQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCsatQuotaNameLengthRule implements StrictCsatQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCsatQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCsatQuotaRequiredVariantRule implements StrictCsatQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCsatQuota): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict csat quota. */
export class StrictCsatQuotaValidator {
  rules: StrictCsatQuotaRule[];

  constructor(rules: StrictCsatQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCsatQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictCsatQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCsatQuota[]): Map<string, string[]> {
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

export function defaultStrictCsatQuotaValidator(): StrictCsatQuotaValidator {
  return new StrictCsatQuotaValidator(
    [
      new StrictCsatQuotaChannelLengthRule(86400),
      new StrictCsatQuotaCodePrefixRule("ACM"),
      new StrictCsatQuotaGraceDaysRangeRule(32, 255),
      new StrictCsatQuotaRequiredNameRule("strict csat quota needs a value"),
      new StrictCsatQuotaNameLengthRule(80),
      new StrictCsatQuotaRequiredVariantRule("strict csat quota needs an entry"),
    ],
  );
}
