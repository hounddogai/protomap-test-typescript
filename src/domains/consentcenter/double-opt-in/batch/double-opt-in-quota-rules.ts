import { DoubleOptInQuota } from "./double-opt-in-quota.js";

/** A rule a double opt in quota must pass. Check returns its problems, or none. */
export interface DoubleOptInQuotaRule {
  check(item: DoubleOptInQuota): string[];
}

export class DoubleOptInQuotaRequiredCodeRule implements DoubleOptInQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInQuotaRequiredNotesRule implements DoubleOptInQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInQuota): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInQuotaPhoneLengthRule implements DoubleOptInQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInQuota): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInQuotaNameLengthRule implements DoubleOptInQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in quota. */
export class DoubleOptInQuotaValidator {
  rules: DoubleOptInQuotaRule[];

  constructor(rules: DoubleOptInQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInQuota): string[] {
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

  requireValid(item: DoubleOptInQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInQuota[]): Map<string, string[]> {
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

export function defaultDoubleOptInQuotaValidator(): DoubleOptInQuotaValidator {
  return new DoubleOptInQuotaValidator(
    [
      new DoubleOptInQuotaRequiredCodeRule("double opt in quota needs a value"),
      new DoubleOptInQuotaRequiredNotesRule("double opt in quota needs this field"),
      new DoubleOptInQuotaPhoneLengthRule(86400),
      new DoubleOptInQuotaNameLengthRule(120),
    ],
  );
}
