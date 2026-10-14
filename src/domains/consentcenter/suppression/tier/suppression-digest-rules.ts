import * as text from "../../../../kit/text.js";
import { SuppressionDigest } from "./suppression-digest.js";

/** A rule a suppression digest must pass. Check returns its problems, or none. */
export interface SuppressionDigestRule {
  check(item: SuppressionDigest): string[];
}

export class SuppressionDigestRequiredReviewerRule implements SuppressionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionDigest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionDigestAllowedReviewerRule implements SuppressionDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is unknown`];
    return [];
  }
}

export class SuppressionDigestRequiredCodeRule implements SuppressionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression digest. */
export class SuppressionDigestValidator {
  rules: SuppressionDigestRule[];

  constructor(rules: SuppressionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionDigest[]): Map<string, string[]> {
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

export function defaultSuppressionDigestValidator(): SuppressionDigestValidator {
  return new SuppressionDigestValidator(
    [
      new SuppressionDigestRequiredReviewerRule("suppression digest needs a value"),
      new SuppressionDigestAllowedReviewerRule([]),
      new SuppressionDigestRequiredCodeRule("suppression digest needs a value"),
    ],
  );
}
