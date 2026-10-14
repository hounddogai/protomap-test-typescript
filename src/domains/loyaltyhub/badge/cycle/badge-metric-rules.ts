import * as text from "../../../../kit/text.js";
import { BadgeMetric } from "./badge-metric.js";

/** A rule a badge metric must pass. Check returns its problems, or none. */
export interface BadgeMetricRule {
  check(item: BadgeMetric): string[];
}

export class BadgeMetricLabelLengthRule implements BadgeMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeMetricAllowedContactEmailRule implements BadgeMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is blocked`];
    return [];
  }
}

export class BadgeMetricRequiredContactEmailRule implements BadgeMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeMetric): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeMetricRequiredCodeRule implements BadgeMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeMetricTagsLimitRule implements BadgeMetricRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BadgeMetric): string[] {
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

/** Runs every rule of a badge metric. */
export class BadgeMetricValidator {
  rules: BadgeMetricRule[];

  constructor(rules: BadgeMetricRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeMetric[]): Map<string, string[]> {
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

export function defaultBadgeMetricValidator(): BadgeMetricValidator {
  return new BadgeMetricValidator(
    [
      new BadgeMetricLabelLengthRule(80),
      new BadgeMetricAllowedContactEmailRule(["manual", "fallback", "capped"]),
      new BadgeMetricRequiredContactEmailRule("badge metric needs a value"),
      new BadgeMetricRequiredCodeRule("badge metric needs this field"),
      new BadgeMetricTagsLimitRule(32, []),
    ],
  );
}
