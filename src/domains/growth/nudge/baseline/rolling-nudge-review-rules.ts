import { RollingNudgeReview } from "./rolling-nudge-review.js";

/** A rule a rolling nudge review must pass. Check returns its problems, or none. */
export interface RollingNudgeReviewRule {
  check(item: RollingNudgeReview): string[];
}

export class RollingNudgeReviewCodePrefixRule implements RollingNudgeReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingNudgeReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingNudgeReviewRequiredCodeRule implements RollingNudgeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgeReviewLabelLengthRule implements RollingNudgeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling nudge review. */
export class RollingNudgeReviewValidator {
  rules: RollingNudgeReviewRule[];

  constructor(rules: RollingNudgeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeReview): string[] {
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

  requireValid(item: RollingNudgeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeReview[]): Map<string, string[]> {
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

export function defaultRollingNudgeReviewValidator(): RollingNudgeReviewValidator {
  return new RollingNudgeReviewValidator(
    [
      new RollingNudgeReviewCodePrefixRule("ACM"),
      new RollingNudgeReviewRequiredCodeRule("rolling nudge review needs an entry"),
      new RollingNudgeReviewLabelLengthRule(1000),
    ],
  );
}
