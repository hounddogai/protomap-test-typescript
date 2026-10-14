import { LenientRetentionDraft } from "./lenient-retention-draft.js";

/** A rule a lenient retention draft must pass. Check returns its problems, or none. */
export interface LenientRetentionDraftRule {
  check(item: LenientRetentionDraft): string[];
}

export class LenientRetentionDraftTagsLimitRule implements LenientRetentionDraftRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LenientRetentionDraft): string[] {
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

export class LenientRetentionDraftSegmentLengthRule implements LenientRetentionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRetentionDraft): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRetentionDraftVisibleGuardRule implements LenientRetentionDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientRetentionDraft): string[] {
    if (item.visible && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LenientRetentionDraftCreatedAtRangeRule implements LenientRetentionDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRetentionDraft): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientRetentionDraftRequiredSegmentRule implements LenientRetentionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRetentionDraft): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRetentionDraftRequiredLabelRule implements LenientRetentionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRetentionDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient retention draft. */
export class LenientRetentionDraftValidator {
  rules: LenientRetentionDraftRule[];

  constructor(rules: LenientRetentionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRetentionDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRetentionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRetentionDraft[]): Map<string, string[]> {
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

export function defaultLenientRetentionDraftValidator(): LenientRetentionDraftValidator {
  return new LenientRetentionDraftValidator(
    [
      new LenientRetentionDraftTagsLimitRule(3600, []),
      new LenientRetentionDraftSegmentLengthRule(64),
      new LenientRetentionDraftVisibleGuardRule(3600),
      new LenientRetentionDraftCreatedAtRangeRule(16, 3600),
      new LenientRetentionDraftRequiredSegmentRule("lenient retention draft needs a value"),
      new LenientRetentionDraftRequiredLabelRule("lenient retention draft needs this field"),
    ],
  );
}
