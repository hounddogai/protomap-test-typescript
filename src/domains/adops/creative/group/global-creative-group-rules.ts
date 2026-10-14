import * as text from "../../../../kit/text.js";
import { GlobalCreativeGroup } from "./global-creative-group.js";

/** A rule a global creative group must pass. Check returns its problems, or none. */
export interface GlobalCreativeGroupRule {
  check(item: GlobalCreativeGroup): string[];
}

export class GlobalCreativeGroupDescriptionLengthRule implements GlobalCreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativeGroup): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCreativeGroupAllowedDescriptionRule implements GlobalCreativeGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalCreativeGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is duplicated`];
    return [];
  }
}

export class GlobalCreativeGroupTitleLengthRule implements GlobalCreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativeGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global creative group. */
export class GlobalCreativeGroupValidator {
  rules: GlobalCreativeGroupRule[];

  constructor(rules: GlobalCreativeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreativeGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCreativeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreativeGroup[]): Map<string, string[]> {
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

export function defaultGlobalCreativeGroupValidator(): GlobalCreativeGroupValidator {
  return new GlobalCreativeGroupValidator(
    [
      new GlobalCreativeGroupDescriptionLengthRule(16),
      new GlobalCreativeGroupAllowedDescriptionRule(["rolling", "legacy", "weighted"]),
      new GlobalCreativeGroupTitleLengthRule(86400),
    ],
  );
}
