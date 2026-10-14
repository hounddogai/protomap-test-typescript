import { PostNotice } from "./post-notice.js";

/** A rule a post notice must pass. Check returns its problems, or none. */
export interface PostNoticeRule {
  check(item: PostNotice): string[];
}

export class PostNoticeRequiredRegionRule implements PostNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostNotice): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PostNoticeTitleLengthRule implements PostNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostNoticeRegionLengthRule implements PostNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostNotice): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostNoticeDescriptionLengthRule implements PostNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostNotice): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post notice. */
export class PostNoticeValidator {
  rules: PostNoticeRule[];

  constructor(rules: PostNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PostNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostNotice[]): Map<string, string[]> {
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

export function defaultPostNoticeValidator(): PostNoticeValidator {
  return new PostNoticeValidator(
    [
      new PostNoticeRequiredRegionRule("post notice needs this field"),
      new PostNoticeTitleLengthRule(32),
      new PostNoticeRegionLengthRule(16),
      new PostNoticeDescriptionLengthRule(32),
    ],
  );
}
