import * as text from "../../../../kit/text.js";
import { MentionSnapshot } from "./mention-snapshot.js";

/** A rule a mention snapshot must pass. Check returns its problems, or none. */
export interface MentionSnapshotRule {
  check(item: MentionSnapshot): string[];
}

export class MentionSnapshotCohortLengthRule implements MentionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionSnapshot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionSnapshotDiscountRangeRule implements MentionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionSnapshot): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionSnapshotAllowedCohortRule implements MentionSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

export class MentionSnapshotCodePrefixRule implements MentionSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionSnapshotRequiredTitleRule implements MentionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention snapshot. */
export class MentionSnapshotValidator {
  rules: MentionSnapshotRule[];

  constructor(rules: MentionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: MentionSnapshot): string[] {
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

  requireValid(item: MentionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionSnapshot[]): Map<string, string[]> {
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

export function defaultMentionSnapshotValidator(): MentionSnapshotValidator {
  return new MentionSnapshotValidator(
    [
      new MentionSnapshotCohortLengthRule(1000),
      new MentionSnapshotDiscountRangeRule(1.9, 3826.5),
      new MentionSnapshotAllowedCohortRule(["rolling", "default", "primary"]),
      new MentionSnapshotCodePrefixRule("OPS"),
      new MentionSnapshotRequiredTitleRule("mention snapshot needs an entry"),
    ],
  );
}
