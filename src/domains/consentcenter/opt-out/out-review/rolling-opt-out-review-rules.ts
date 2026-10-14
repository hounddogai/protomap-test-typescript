import { RollingOptOutReview } from "./rolling-opt-out-review.js";

/** A rule a rolling opt out review must pass. Check returns its problems, or none. */
export interface RollingOptOutReviewRule {
  check(item: RollingOptOutReview): string[];
}

export class RollingOptOutReviewRequiredExternalRefRule implements RollingOptOutReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutReview): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutReviewRequiredCodeRule implements RollingOptOutReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutReviewCodePrefixRule implements RollingOptOutReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingOptOutReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingOptOutReviewTitleLengthRule implements RollingOptOutReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutReviewSegmentLengthRule implements RollingOptOutReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutReview): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling opt out review. */
export class RollingOptOutReviewValidator {
  rules: RollingOptOutReviewRule[];

  constructor(rules: RollingOptOutReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RollingOptOutReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingOptOutReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingOptOutReview[]): Map<string, string[]> {
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

export function defaultRollingOptOutReviewValidator(): RollingOptOutReviewValidator {
  return new RollingOptOutReviewValidator(
    [
      new RollingOptOutReviewRequiredExternalRefRule("rolling opt out review needs a value"),
      new RollingOptOutReviewRequiredCodeRule("rolling opt out review needs this field"),
      new RollingOptOutReviewCodePrefixRule("ACM"),
      new RollingOptOutReviewTitleLengthRule(86400),
      new RollingOptOutReviewSegmentLengthRule(3600),
    ],
  );
}
