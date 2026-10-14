import { ComplaintQuota } from "./complaint-quota.js";

/** A rule a complaint quota must pass. Check returns its problems, or none. */
export interface ComplaintQuotaRule {
  check(item: ComplaintQuota): string[];
}

export class ComplaintQuotaCodeLengthRule implements ComplaintQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintQuotaCreatedAtRangeRule implements ComplaintQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintQuota): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintQuotaRequiredCodeRule implements ComplaintQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintQuotaCeilingRangeRule implements ComplaintQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintQuota): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintQuotaPhoneLengthRule implements ComplaintQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintQuota): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintQuotaCodePrefixRule implements ComplaintQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a complaint quota. */
export class ComplaintQuotaValidator {
  rules: ComplaintQuotaRule[];

  constructor(rules: ComplaintQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintQuota): string[] {
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

  requireValid(item: ComplaintQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintQuota[]): Map<string, string[]> {
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

export function defaultComplaintQuotaValidator(): ComplaintQuotaValidator {
  return new ComplaintQuotaValidator(
    [
      new ComplaintQuotaCodeLengthRule(16),
      new ComplaintQuotaCreatedAtRangeRule(80, 120),
      new ComplaintQuotaRequiredCodeRule("complaint quota needs a value"),
      new ComplaintQuotaCeilingRangeRule(7.5, 1468.1),
      new ComplaintQuotaPhoneLengthRule(255),
      new ComplaintQuotaCodePrefixRule("X"),
    ],
  );
}
