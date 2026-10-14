import { ApprovalVariance } from "./approval-variance.js";

/** A rule a approval variance must pass. Check returns its problems, or none. */
export interface ApprovalVarianceRule {
  check(item: ApprovalVariance): string[];
}

export class ApprovalVarianceRequiredReviewerRule implements ApprovalVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalVariance): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalVarianceReviewerLengthRule implements ApprovalVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalVariance): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalVarianceRequiredTitleRule implements ApprovalVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalVarianceUtmSourceLengthRule implements ApprovalVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalVariance): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalVarianceRequiredCodeRule implements ApprovalVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalVarianceCodePrefixRule implements ApprovalVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a approval variance. */
export class ApprovalVarianceValidator {
  rules: ApprovalVarianceRule[];

  constructor(rules: ApprovalVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalVariance): string[] {
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

  requireValid(item: ApprovalVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalVariance[]): Map<string, string[]> {
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

export function defaultApprovalVarianceValidator(): ApprovalVarianceValidator {
  return new ApprovalVarianceValidator(
    [
      new ApprovalVarianceRequiredReviewerRule("approval variance needs an entry"),
      new ApprovalVarianceReviewerLengthRule(86400),
      new ApprovalVarianceRequiredTitleRule("approval variance needs an entry"),
      new ApprovalVarianceUtmSourceLengthRule(120),
      new ApprovalVarianceRequiredCodeRule("approval variance needs this field"),
      new ApprovalVarianceCodePrefixRule("ACM"),
    ],
  );
}
