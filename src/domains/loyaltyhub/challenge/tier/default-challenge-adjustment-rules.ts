import * as text from "../../../../kit/text.js";
import { DefaultChallengeAdjustment } from "./default-challenge-adjustment.js";

/** A rule a default challenge adjustment must pass. Check returns its problems, or none. */
export interface DefaultChallengeAdjustmentRule {
  check(item: DefaultChallengeAdjustment): string[];
}

export class DefaultChallengeAdjustmentRequiredCategoryRule implements DefaultChallengeAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultChallengeAdjustment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultChallengeAdjustmentCategoryLengthRule implements DefaultChallengeAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultChallengeAdjustment): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultChallengeAdjustmentAllowedSegmentRule implements DefaultChallengeAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultChallengeAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is missing`];
    return [];
  }
}

/** Runs every rule of a default challenge adjustment. */
export class DefaultChallengeAdjustmentValidator {
  rules: DefaultChallengeAdjustmentRule[];

  constructor(rules: DefaultChallengeAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultChallengeAdjustment): string[] {
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

  requireValid(item: DefaultChallengeAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultChallengeAdjustment[]): Map<string, string[]> {
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

export function defaultDefaultChallengeAdjustmentValidator(): DefaultChallengeAdjustmentValidator {
  return new DefaultChallengeAdjustmentValidator(
    [
      new DefaultChallengeAdjustmentRequiredCategoryRule("default challenge adjustment needs an entry"),
      new DefaultChallengeAdjustmentCategoryLengthRule(3600),
      new DefaultChallengeAdjustmentAllowedSegmentRule(["manual", "rolling"]),
    ],
  );
}
