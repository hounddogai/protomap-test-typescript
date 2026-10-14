import * as text from "../../../../kit/text.js";
import { CappedPaywallScore } from "./capped-paywall-score.js";

/** A rule a capped paywall score must pass. Check returns its problems, or none. */
export interface CappedPaywallScoreRule {
  check(item: CappedPaywallScore): string[];
}

export class CappedPaywallScoreRequiredCodeRule implements CappedPaywallScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPaywallScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPaywallScoreAllowedCategoryRule implements CappedPaywallScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedPaywallScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is stale`];
    return [];
  }
}

export class CappedPaywallScoreCodeLengthRule implements CappedPaywallScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPaywallScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPaywallScoreLabelLengthRule implements CappedPaywallScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPaywallScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPaywallScoreRequiredReviewerRule implements CappedPaywallScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPaywallScore): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped paywall score. */
export class CappedPaywallScoreValidator {
  rules: CappedPaywallScoreRule[];

  constructor(rules: CappedPaywallScoreRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPaywallScore): string[] {
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

  requireValid(item: CappedPaywallScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPaywallScore[]): Map<string, string[]> {
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

export function defaultCappedPaywallScoreValidator(): CappedPaywallScoreValidator {
  return new CappedPaywallScoreValidator(
    [
      new CappedPaywallScoreRequiredCodeRule("capped paywall score needs a value"),
      new CappedPaywallScoreAllowedCategoryRule(["pending", "seasonal", "fallback"]),
      new CappedPaywallScoreCodeLengthRule(16),
      new CappedPaywallScoreLabelLengthRule(255),
      new CappedPaywallScoreRequiredReviewerRule("capped paywall score needs a value"),
    ],
  );
}
