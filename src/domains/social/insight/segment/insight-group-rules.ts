import * as text from "../../../../kit/text.js";
import { InsightGroup } from "./insight-group.js";

/** A rule a insight group must pass. Check returns its problems, or none. */
export interface InsightGroupRule {
  check(item: InsightGroup): string[];
}

export class InsightGroupRequiredReviewerRule implements InsightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightGroup): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class InsightGroupAllowedCategoryRule implements InsightGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is expired`];
    return [];
  }
}

export class InsightGroupCodePrefixRule implements InsightGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightGroupRequiredCategoryRule implements InsightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightGroup): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight group. */
export class InsightGroupValidator {
  rules: InsightGroupRule[];

  constructor(rules: InsightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: InsightGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightGroup[]): Map<string, string[]> {
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

export function defaultInsightGroupValidator(): InsightGroupValidator {
  return new InsightGroupValidator(
    [
      new InsightGroupRequiredReviewerRule("insight group needs a value"),
      new InsightGroupAllowedCategoryRule([]),
      new InsightGroupCodePrefixRule("ACM"),
      new InsightGroupRequiredCategoryRule("insight group needs a value"),
    ],
  );
}
