import * as text from "../../../../kit/text.js";
import { LenientBounceScore } from "./lenient-bounce-score.js";

/** A rule a lenient bounce score must pass. Check returns its problems, or none. */
export interface LenientBounceScoreRule {
  check(item: LenientBounceScore): string[];
}

export class LenientBounceScoreArchivedGuardRule implements LenientBounceScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientBounceScore): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LenientBounceScoreRequiredCampaignRefRule implements LenientBounceScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBounceScore): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBounceScoreTitleLengthRule implements LenientBounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBounceScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBounceScoreAllowedTitleRule implements LenientBounceScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientBounceScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class LenientBounceScoreBudgetRangeRule implements LenientBounceScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBounceScore): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient bounce score. */
export class LenientBounceScoreValidator {
  rules: LenientBounceScoreRule[];

  constructor(rules: LenientBounceScoreRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBounceScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientBounceScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBounceScore[]): Map<string, string[]> {
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

export function defaultLenientBounceScoreValidator(): LenientBounceScoreValidator {
  return new LenientBounceScoreValidator(
    [
      new LenientBounceScoreArchivedGuardRule(9.1),
      new LenientBounceScoreRequiredCampaignRefRule("lenient bounce score needs an entry"),
      new LenientBounceScoreTitleLengthRule(1000),
      new LenientBounceScoreAllowedTitleRule([]),
      new LenientBounceScoreBudgetRangeRule(2.6, 2338.8),
    ],
  );
}
