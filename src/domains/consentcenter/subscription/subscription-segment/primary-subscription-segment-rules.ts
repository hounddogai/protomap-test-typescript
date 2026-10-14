import * as text from "../../../../kit/text.js";
import { PrimarySubscriptionSegment } from "./primary-subscription-segment.js";

/** A rule a primary subscription segment must pass. Check returns its problems, or none. */
export interface PrimarySubscriptionSegmentRule {
  check(item: PrimarySubscriptionSegment): string[];
}

export class PrimarySubscriptionSegmentUpdatedAtRangeRule implements PrimarySubscriptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySubscriptionSegment): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimarySubscriptionSegmentRequiredCodeRule implements PrimarySubscriptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySubscriptionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySubscriptionSegmentTitleLengthRule implements PrimarySubscriptionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySubscriptionSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySubscriptionSegmentMarginRangeRule implements PrimarySubscriptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySubscriptionSegment): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimarySubscriptionSegmentAllowedTitleRule implements PrimarySubscriptionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimarySubscriptionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class PrimarySubscriptionSegmentTagsLimitRule implements PrimarySubscriptionSegmentRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PrimarySubscriptionSegment): string[] {
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

/** Runs every rule of a primary subscription segment. */
export class PrimarySubscriptionSegmentValidator {
  rules: PrimarySubscriptionSegmentRule[];

  constructor(rules: PrimarySubscriptionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySubscriptionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySubscriptionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySubscriptionSegment[]): Map<string, string[]> {
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

export function defaultPrimarySubscriptionSegmentValidator(): PrimarySubscriptionSegmentValidator {
  return new PrimarySubscriptionSegmentValidator(
    [
      new PrimarySubscriptionSegmentUpdatedAtRangeRule(255, 1000),
      new PrimarySubscriptionSegmentRequiredCodeRule("primary subscription segment needs an entry"),
      new PrimarySubscriptionSegmentTitleLengthRule(3600),
      new PrimarySubscriptionSegmentMarginRangeRule(4.8, 4933.9),
      new PrimarySubscriptionSegmentAllowedTitleRule(["regional", "pending"]),
      new PrimarySubscriptionSegmentTagsLimitRule(80, []),
    ],
  );
}
