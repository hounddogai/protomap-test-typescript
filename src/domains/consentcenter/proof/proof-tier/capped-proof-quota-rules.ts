import { CappedProofQuota } from "./capped-proof-quota.js";

/** A rule a capped proof quota must pass. Check returns its problems, or none. */
export interface CappedProofQuotaRule {
  check(item: CappedProofQuota): string[];
}

export class CappedProofQuotaCodeLengthRule implements CappedProofQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedProofQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedProofQuotaSourceLengthRule implements CappedProofQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedProofQuota): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedProofQuotaScoreRangeRule implements CappedProofQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedProofQuota): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped proof quota. */
export class CappedProofQuotaValidator {
  rules: CappedProofQuotaRule[];

  constructor(rules: CappedProofQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CappedProofQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedProofQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedProofQuota[]): Map<string, string[]> {
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

export function defaultCappedProofQuotaValidator(): CappedProofQuotaValidator {
  return new CappedProofQuotaValidator(
    [
      new CappedProofQuotaCodeLengthRule(1000),
      new CappedProofQuotaSourceLengthRule(255),
      new CappedProofQuotaScoreRangeRule(0.7, 3925.6),
    ],
  );
}
