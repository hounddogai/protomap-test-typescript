import * as text from "../../../../kit/text.js";
import { LegacyLevelNotice } from "./legacy-level-notice.js";

/** A rule a legacy level notice must pass. Check returns its problems, or none. */
export interface LegacyLevelNoticeRule {
  check(item: LegacyLevelNotice): string[];
}

export class LegacyLevelNoticeTitleLengthRule implements LegacyLevelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyLevelNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyLevelNoticeMaximumRangeRule implements LegacyLevelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyLevelNotice): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyLevelNoticeAllowedTitleRule implements LegacyLevelNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyLevelNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

/** Runs every rule of a legacy level notice. */
export class LegacyLevelNoticeValidator {
  rules: LegacyLevelNoticeRule[];

  constructor(rules: LegacyLevelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyLevelNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyLevelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyLevelNotice[]): Map<string, string[]> {
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

export function defaultLegacyLevelNoticeValidator(): LegacyLevelNoticeValidator {
  return new LegacyLevelNoticeValidator(
    [
      new LegacyLevelNoticeTitleLengthRule(86400),
      new LegacyLevelNoticeMaximumRangeRule(3.7, 4291),
      new LegacyLevelNoticeAllowedTitleRule([]),
    ],
  );
}
