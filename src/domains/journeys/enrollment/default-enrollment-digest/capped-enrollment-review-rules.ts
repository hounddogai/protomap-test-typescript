import { CappedEnrollmentReview } from "./capped-enrollment-review.js";

/** A rule a capped enrollment review must pass. Check returns its problems, or none. */
export interface CappedEnrollmentReviewRule {
  check(item: CappedEnrollmentReview): string[];
}

export class CappedEnrollmentReviewChecksumLengthRule implements CappedEnrollmentReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentReview): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedEnrollmentReviewRequiredTitleRule implements CappedEnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedEnrollmentReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedEnrollmentReviewRequiredChecksumRule implements CappedEnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedEnrollmentReview): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class CappedEnrollmentReviewCodePrefixRule implements CappedEnrollmentReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedEnrollmentReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedEnrollmentReviewTitleLengthRule implements CappedEnrollmentReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedEnrollmentReviewTagsLimitRule implements CappedEnrollmentReviewRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CappedEnrollmentReview): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a capped enrollment review. */
export class CappedEnrollmentReviewValidator {
  rules: CappedEnrollmentReviewRule[];

  constructor(rules: CappedEnrollmentReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CappedEnrollmentReview): string[] {
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

  requireValid(item: CappedEnrollmentReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedEnrollmentReview[]): Map<string, string[]> {
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

export function defaultCappedEnrollmentReviewValidator(): CappedEnrollmentReviewValidator {
  return new CappedEnrollmentReviewValidator(
    [
      new CappedEnrollmentReviewChecksumLengthRule(255),
      new CappedEnrollmentReviewRequiredTitleRule("capped enrollment review needs a value"),
      new CappedEnrollmentReviewRequiredChecksumRule("capped enrollment review needs a value"),
      new CappedEnrollmentReviewCodePrefixRule("REF"),
      new CappedEnrollmentReviewTitleLengthRule(16),
      new CappedEnrollmentReviewTagsLimitRule(3600, ["default", "fallback", "legacy"]),
    ],
  );
}
