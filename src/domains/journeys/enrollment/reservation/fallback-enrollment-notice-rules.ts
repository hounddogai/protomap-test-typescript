import { FallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

/** A rule a fallback enrollment notice must pass. Check returns its problems, or none. */
export interface FallbackEnrollmentNoticeRule {
  check(item: FallbackEnrollmentNotice): string[];
}

export class FallbackEnrollmentNoticeCodePrefixRule implements FallbackEnrollmentNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackEnrollmentNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackEnrollmentNoticeCodeLengthRule implements FallbackEnrollmentNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackEnrollmentNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackEnrollmentNoticeTagsLimitRule implements FallbackEnrollmentNoticeRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FallbackEnrollmentNotice): string[] {
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

export class FallbackEnrollmentNoticeOwnerIdLengthRule implements FallbackEnrollmentNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackEnrollmentNotice): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackEnrollmentNoticeRequiredTitleRule implements FallbackEnrollmentNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackEnrollmentNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback enrollment notice. */
export class FallbackEnrollmentNoticeValidator {
  rules: FallbackEnrollmentNoticeRule[];

  constructor(rules: FallbackEnrollmentNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackEnrollmentNotice): string[] {
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

  requireValid(item: FallbackEnrollmentNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackEnrollmentNotice[]): Map<string, string[]> {
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

export function defaultFallbackEnrollmentNoticeValidator(): FallbackEnrollmentNoticeValidator {
  return new FallbackEnrollmentNoticeValidator(
    [
      new FallbackEnrollmentNoticeCodePrefixRule("Q"),
      new FallbackEnrollmentNoticeCodeLengthRule(120),
      new FallbackEnrollmentNoticeTagsLimitRule(64, ["scheduled"]),
      new FallbackEnrollmentNoticeOwnerIdLengthRule(255),
      new FallbackEnrollmentNoticeRequiredTitleRule("fallback enrollment notice needs a value"),
    ],
  );
}
