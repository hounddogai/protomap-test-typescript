import { RollingWindowQuota } from "./rolling-window-quota.js";

/** A rule a rolling window quota must pass. Check returns its problems, or none. */
export interface RollingWindowQuotaRule {
  check(item: RollingWindowQuota): string[];
}

export class RollingWindowQuotaRequiredLabelRule implements RollingWindowQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWindowQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWindowQuotaLabelLengthRule implements RollingWindowQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWindowQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWindowQuotaSendAtRangeRule implements RollingWindowQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWindowQuota): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling window quota. */
export class RollingWindowQuotaValidator {
  rules: RollingWindowQuotaRule[];

  constructor(rules: RollingWindowQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWindowQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingWindowQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWindowQuota[]): Map<string, string[]> {
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

export function defaultRollingWindowQuotaValidator(): RollingWindowQuotaValidator {
  return new RollingWindowQuotaValidator(
    [
      new RollingWindowQuotaRequiredLabelRule("rolling window quota needs an entry"),
      new RollingWindowQuotaLabelLengthRule(1000),
      new RollingWindowQuotaSendAtRangeRule(64, 80),
    ],
  );
}
