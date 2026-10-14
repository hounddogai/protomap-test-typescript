import { ApprovalTier } from "./approval-tier.js";

/** A rule a approval tier must pass. Check returns its problems, or none. */
export interface ApprovalTierRule {
  check(item: ApprovalTier): string[];
}

export class ApprovalTierRequiredSourceRule implements ApprovalTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalTier): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalTierTitleLengthRule implements ApprovalTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalTierCohortLengthRule implements ApprovalTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalTier): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalTierCodePrefixRule implements ApprovalTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalTierBatchSizeRangeRule implements ApprovalTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalTier): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a approval tier. */
export class ApprovalTierValidator {
  rules: ApprovalTierRule[];

  constructor(rules: ApprovalTierRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalTier[]): Map<string, string[]> {
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

export function defaultApprovalTierValidator(): ApprovalTierValidator {
  return new ApprovalTierValidator(
    [
      new ApprovalTierRequiredSourceRule("approval tier needs a value"),
      new ApprovalTierTitleLengthRule(86400),
      new ApprovalTierCohortLengthRule(64),
      new ApprovalTierCodePrefixRule("ACM"),
      new ApprovalTierBatchSizeRangeRule(16, 120),
    ],
  );
}
