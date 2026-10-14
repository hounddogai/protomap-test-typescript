import * as text from "../../../../kit/text.js";
import { PostSnapshot } from "./post-snapshot.js";

/** A rule a post snapshot must pass. Check returns its problems, or none. */
export interface PostSnapshotRule {
  check(item: PostSnapshot): string[];
}

export class PostSnapshotRequiredTitleRule implements PostSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PostSnapshotAllowedVariantRule implements PostSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is unknown`];
    return [];
  }
}

export class PostSnapshotLimitRangeRule implements PostSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostSnapshot): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostSnapshotRequiredChannelRule implements PostSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostSnapshot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PostSnapshotCodeLengthRule implements PostSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostSnapshotTitleLengthRule implements PostSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post snapshot. */
export class PostSnapshotValidator {
  rules: PostSnapshotRule[];

  constructor(rules: PostSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PostSnapshot): string[] {
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

  requireValid(item: PostSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostSnapshot[]): Map<string, string[]> {
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

export function defaultPostSnapshotValidator(): PostSnapshotValidator {
  return new PostSnapshotValidator(
    [
      new PostSnapshotRequiredTitleRule("post snapshot needs a value"),
      new PostSnapshotAllowedVariantRule(["batched", "tiered"]),
      new PostSnapshotLimitRangeRule(16, 32),
      new PostSnapshotRequiredChannelRule("post snapshot needs an entry"),
      new PostSnapshotCodeLengthRule(80),
      new PostSnapshotTitleLengthRule(3600),
    ],
  );
}
