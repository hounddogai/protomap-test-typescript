import * as text from "../../../../kit/text.js";
import { ManualRetentionScore } from "./manual-retention-score.js";

/** A rule a manual retention score must pass. Check returns its problems, or none. */
export interface ManualRetentionScoreRule {
  check(item: ManualRetentionScore): string[];
}

export class ManualRetentionScoreCohortLengthRule implements ManualRetentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionScore): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionScoreAllowedCodeRule implements ManualRetentionScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualRetentionScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class ManualRetentionScoreCodeLengthRule implements ManualRetentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionScoreDiscountRangeRule implements ManualRetentionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRetentionScore): string[] {
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

export class ManualRetentionScoreTagsLimitRule implements ManualRetentionScoreRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ManualRetentionScore): string[] {
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

/** Runs every rule of a manual retention score. */
export class ManualRetentionScoreValidator {
  rules: ManualRetentionScoreRule[];

  constructor(rules: ManualRetentionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRetentionScore): string[] {
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

  requireValid(item: ManualRetentionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRetentionScore[]): Map<string, string[]> {
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

export function defaultManualRetentionScoreValidator(): ManualRetentionScoreValidator {
  return new ManualRetentionScoreValidator(
    [
      new ManualRetentionScoreCohortLengthRule(86400),
      new ManualRetentionScoreAllowedCodeRule([]),
      new ManualRetentionScoreCodeLengthRule(64),
      new ManualRetentionScoreDiscountRangeRule(6.9, 3250.8),
      new ManualRetentionScoreTagsLimitRule(1000, ["strict", "seasonal", "scheduled"]),
    ],
  );
}
