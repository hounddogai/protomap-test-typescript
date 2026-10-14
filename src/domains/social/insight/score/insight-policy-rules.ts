import * as text from "../../../../kit/text.js";
import { InsightPolicy } from "./insight-policy.js";

/** A rule a insight policy must pass. Check returns its problems, or none. */
export interface InsightPolicyRule {
  check(item: InsightPolicy): string[];
}

export class InsightPolicyCategoryLengthRule implements InsightPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightPolicy): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightPolicyAllowedNotesRule implements InsightPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is stale`];
    return [];
  }
}

export class InsightPolicyRequiredCategoryRule implements InsightPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightPolicy): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class InsightPolicyTagsLimitRule implements InsightPolicyRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: InsightPolicy): string[] {
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

export class InsightPolicyVisibleGuardRule implements InsightPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InsightPolicy): string[] {
    if (item.visible && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a insight policy. */
export class InsightPolicyValidator {
  rules: InsightPolicyRule[];

  constructor(rules: InsightPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: InsightPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightPolicy[]): Map<string, string[]> {
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

export function defaultInsightPolicyValidator(): InsightPolicyValidator {
  return new InsightPolicyValidator(
    [
      new InsightPolicyCategoryLengthRule(86400),
      new InsightPolicyAllowedNotesRule(["legacy", "pending", "pending"]),
      new InsightPolicyRequiredCategoryRule("insight policy needs an entry"),
      new InsightPolicyTagsLimitRule(64, []),
      new InsightPolicyVisibleGuardRule(80),
    ],
  );
}
