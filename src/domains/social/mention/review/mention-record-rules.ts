import * as text from "../../../../kit/text.js";
import { MentionRecord } from "./mention-record.js";

/** A rule a mention record must pass. Check returns its problems, or none. */
export interface MentionRecordRule {
  check(item: MentionRecord): string[];
}

export class MentionRecordDiscountRangeRule implements MentionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionRecord): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionRecordNameLengthRule implements MentionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionRecordAllowedNameRule implements MentionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class MentionRecordTagsLimitRule implements MentionRecordRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: MentionRecord): string[] {
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

export class MentionRecordRequiredNameRule implements MentionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class MentionRecordCodeLengthRule implements MentionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention record. */
export class MentionRecordValidator {
  rules: MentionRecordRule[];

  constructor(rules: MentionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: MentionRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionRecord[]): Map<string, string[]> {
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

export function defaultMentionRecordValidator(): MentionRecordValidator {
  return new MentionRecordValidator(
    [
      new MentionRecordDiscountRangeRule(6.3, 289.6),
      new MentionRecordNameLengthRule(80),
      new MentionRecordAllowedNameRule(["regional", "seasonal"]),
      new MentionRecordTagsLimitRule(120, ["rolling", "primary"]),
      new MentionRecordRequiredNameRule("mention record needs an entry"),
      new MentionRecordCodeLengthRule(255),
    ],
  );
}
