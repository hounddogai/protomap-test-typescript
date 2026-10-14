import * as text from "../../../../kit/text.js";
import { AdaptiveBranchScore } from "./adaptive-branch-score.js";

/** A rule a adaptive branch score must pass. Check returns its problems, or none. */
export interface AdaptiveBranchScoreRule {
  check(item: AdaptiveBranchScore): string[];
}

export class AdaptiveBranchScoreCodePrefixRule implements AdaptiveBranchScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveBranchScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveBranchScoreAllowedTitleRule implements AdaptiveBranchScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveBranchScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class AdaptiveBranchScoreRequiredTitleRule implements AdaptiveBranchScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBranchScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBranchScoreQuantityRangeRule implements AdaptiveBranchScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBranchScore): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveBranchScoreCodeLengthRule implements AdaptiveBranchScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBranchScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBranchScoreTitleLengthRule implements AdaptiveBranchScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBranchScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive branch score. */
export class AdaptiveBranchScoreValidator {
  rules: AdaptiveBranchScoreRule[];

  constructor(rules: AdaptiveBranchScoreRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBranchScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveBranchScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBranchScore[]): Map<string, string[]> {
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

export function defaultAdaptiveBranchScoreValidator(): AdaptiveBranchScoreValidator {
  return new AdaptiveBranchScoreValidator(
    [
      new AdaptiveBranchScoreCodePrefixRule("REF"),
      new AdaptiveBranchScoreAllowedTitleRule(["capped", "lenient"]),
      new AdaptiveBranchScoreRequiredTitleRule("adaptive branch score needs this field"),
      new AdaptiveBranchScoreQuantityRangeRule(255, 1000),
      new AdaptiveBranchScoreCodeLengthRule(255),
      new AdaptiveBranchScoreTitleLengthRule(16),
    ],
  );
}
