import { InsightQuota } from "./insight-quota.js";

/** A rule a insight quota must pass. Check returns its problems, or none. */
export interface InsightQuotaRule {
  check(item: InsightQuota): string[];
}

export class InsightQuotaExpiresAtRangeRule implements InsightQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightQuota): string[] {
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

export class InsightQuotaRequiredTitleRule implements InsightQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InsightQuotaVersionRangeRule implements InsightQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightQuota): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a insight quota. */
export class InsightQuotaValidator {
  rules: InsightQuotaRule[];

  constructor(rules: InsightQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: InsightQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightQuota[]): Map<string, string[]> {
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

export function defaultInsightQuotaValidator(): InsightQuotaValidator {
  return new InsightQuotaValidator(
    [
      new InsightQuotaExpiresAtRangeRule(32, 3600),
      new InsightQuotaRequiredTitleRule("insight quota needs this field"),
      new InsightQuotaVersionRangeRule(32, 3600),
    ],
  );
}
