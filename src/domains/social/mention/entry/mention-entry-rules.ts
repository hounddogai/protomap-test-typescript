import * as text from "../../../../kit/text.js";
import { MentionEntry } from "./mention-entry.js";

/** A rule a mention entry must pass. Check returns its problems, or none. */
export interface MentionEntryRule {
  check(item: MentionEntry): string[];
}

export class MentionEntryWindowDaysRangeRule implements MentionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionEntry): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionEntryVariantLengthRule implements MentionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionEntry): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionEntryAllowedTitleRule implements MentionEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class MentionEntryRequiredCodeRule implements MentionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MentionEntryCeilingRangeRule implements MentionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionEntry): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionEntryRateRangeRule implements MentionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionEntry): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a mention entry. */
export class MentionEntryValidator {
  rules: MentionEntryRule[];

  constructor(rules: MentionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: MentionEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionEntry[]): Map<string, string[]> {
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

export function defaultMentionEntryValidator(): MentionEntryValidator {
  return new MentionEntryValidator(
    [
      new MentionEntryWindowDaysRangeRule(120, 1000),
      new MentionEntryVariantLengthRule(1000),
      new MentionEntryAllowedTitleRule(["strict", "seasonal"]),
      new MentionEntryRequiredCodeRule("mention entry needs an entry"),
      new MentionEntryCeilingRangeRule(4.9, 4230.8),
      new MentionEntryRateRangeRule(2.7, 518.5),
    ],
  );
}
