import * as text from "../../../../kit/text.js";
import { LenientBranchMetric } from "./lenient-branch-metric.js";

/** A rule a lenient branch metric must pass. Check returns its problems, or none. */
export interface LenientBranchMetricRule {
  check(item: LenientBranchMetric): string[];
}

export class LenientBranchMetricTagsLimitRule implements LenientBranchMetricRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LenientBranchMetric): string[] {
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

export class LenientBranchMetricAllowedTitleRule implements LenientBranchMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientBranchMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class LenientBranchMetricTitleLengthRule implements LenientBranchMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBranchMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBranchMetricRequiredTitleRule implements LenientBranchMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBranchMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBranchMetricRequiredCodeRule implements LenientBranchMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBranchMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient branch metric. */
export class LenientBranchMetricValidator {
  rules: LenientBranchMetricRule[];

  constructor(rules: LenientBranchMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBranchMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientBranchMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBranchMetric[]): Map<string, string[]> {
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

export function defaultLenientBranchMetricValidator(): LenientBranchMetricValidator {
  return new LenientBranchMetricValidator(
    [
      new LenientBranchMetricTagsLimitRule(120, []),
      new LenientBranchMetricAllowedTitleRule(["pending", "regional"]),
      new LenientBranchMetricTitleLengthRule(1000),
      new LenientBranchMetricRequiredTitleRule("lenient branch metric needs an entry"),
      new LenientBranchMetricRequiredCodeRule("lenient branch metric needs an entry"),
    ],
  );
}
