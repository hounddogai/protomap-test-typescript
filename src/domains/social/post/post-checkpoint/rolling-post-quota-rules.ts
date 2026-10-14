import { RollingPostQuota } from "./rolling-post-quota.js";

/** A rule a rolling post quota must pass. Check returns its problems, or none. */
export interface RollingPostQuotaRule {
  check(item: RollingPostQuota): string[];
}

export class RollingPostQuotaLabelLengthRule implements RollingPostQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPostQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPostQuotaFrequencyCapRangeRule implements RollingPostQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPostQuota): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingPostQuotaRetriesRangeRule implements RollingPostQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPostQuota): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPostQuotaCodeLengthRule implements RollingPostQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPostQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPostQuotaArchivedGuardRule implements RollingPostQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingPostQuota): string[] {
    if (item.archived && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a rolling post quota. */
export class RollingPostQuotaValidator {
  rules: RollingPostQuotaRule[];

  constructor(rules: RollingPostQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPostQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPostQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPostQuota[]): Map<string, string[]> {
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

export function defaultRollingPostQuotaValidator(): RollingPostQuotaValidator {
  return new RollingPostQuotaValidator(
    [
      new RollingPostQuotaLabelLengthRule(64),
      new RollingPostQuotaFrequencyCapRangeRule(32, 64),
      new RollingPostQuotaRetriesRangeRule(32, 86400),
      new RollingPostQuotaCodeLengthRule(86400),
      new RollingPostQuotaArchivedGuardRule(1000),
    ],
  );
}
