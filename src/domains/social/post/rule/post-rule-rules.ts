import * as text from "../../../../kit/text.js";
import { PostRule } from "./post-rule.js";

/** A rule a post rule must pass. Check returns its problems, or none. */
export interface PostRuleRule {
  check(item: PostRule): string[];
}

export class PostRuleAllowedNameRule implements PostRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class PostRuleRequiredVariantRule implements PostRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostRule): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PostRuleSummaryLengthRule implements PostRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostRule): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostRuleDiscountRangeRule implements PostRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostRule): string[] {
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

/** Runs every rule of a post rule. */
export class PostRuleValidator {
  rules: PostRuleRule[];

  constructor(rules: PostRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PostRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostRule[]): Map<string, string[]> {
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

export function defaultPostRuleValidator(): PostRuleValidator {
  return new PostRuleValidator(
    [
      new PostRuleAllowedNameRule(["global", "legacy", "scheduled"]),
      new PostRuleRequiredVariantRule("post rule needs a value"),
      new PostRuleSummaryLengthRule(32),
      new PostRuleDiscountRangeRule(1.5, 1327.4),
    ],
  );
}
