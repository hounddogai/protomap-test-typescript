import { ApprovalDigest } from "./approval-digest.js";

/** A rule a approval digest must pass. Check returns its problems, or none. */
export interface ApprovalDigestRule {
  check(item: ApprovalDigest): string[];
}

export class ApprovalDigestNameLengthRule implements ApprovalDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalDigestLimitRangeRule implements ApprovalDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalDigest): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalDigestRequiredNameRule implements ApprovalDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalDigestVersionRangeRule implements ApprovalDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalDigest): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a approval digest. */
export class ApprovalDigestValidator {
  rules: ApprovalDigestRule[];

  constructor(rules: ApprovalDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalDigest[]): Map<string, string[]> {
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

export function defaultApprovalDigestValidator(): ApprovalDigestValidator {
  return new ApprovalDigestValidator(
    [
      new ApprovalDigestNameLengthRule(32),
      new ApprovalDigestLimitRangeRule(32, 120),
      new ApprovalDigestRequiredNameRule("approval digest needs an entry"),
      new ApprovalDigestVersionRangeRule(16, 16),
    ],
  );
}
