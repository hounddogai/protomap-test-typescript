import * as text from "../../../../kit/text.js";
import { CappedRedemptionScore } from "./capped-redemption-score.js";

/** A rule a capped redemption score must pass. Check returns its problems, or none. */
export interface CappedRedemptionScoreRule {
  check(item: CappedRedemptionScore): string[];
}

export class CappedRedemptionScoreReviewerLengthRule implements CappedRedemptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRedemptionScore): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedRedemptionScoreRequiredNameRule implements CappedRedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRedemptionScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRedemptionScoreRequiredRegionRule implements CappedRedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRedemptionScore): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRedemptionScoreAllowedReviewerRule implements CappedRedemptionScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedRedemptionScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is too long`];
    return [];
  }
}

export class CappedRedemptionScoreNameLengthRule implements CappedRedemptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRedemptionScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedRedemptionScoreRequiredCodeRule implements CappedRedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRedemptionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped redemption score. */
export class CappedRedemptionScoreValidator {
  rules: CappedRedemptionScoreRule[];

  constructor(rules: CappedRedemptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRedemptionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedRedemptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRedemptionScore[]): Map<string, string[]> {
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

export function defaultCappedRedemptionScoreValidator(): CappedRedemptionScoreValidator {
  return new CappedRedemptionScoreValidator(
    [
      new CappedRedemptionScoreReviewerLengthRule(3600),
      new CappedRedemptionScoreRequiredNameRule("capped redemption score needs an entry"),
      new CappedRedemptionScoreRequiredRegionRule("capped redemption score needs this field"),
      new CappedRedemptionScoreAllowedReviewerRule(["adaptive", "default", "manual"]),
      new CappedRedemptionScoreNameLengthRule(16),
      new CappedRedemptionScoreRequiredCodeRule("capped redemption score needs this field"),
    ],
  );
}
