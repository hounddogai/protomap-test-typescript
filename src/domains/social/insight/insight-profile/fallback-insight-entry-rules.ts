import * as text from "../../../../kit/text.js";
import { FallbackInsightEntry } from "./fallback-insight-entry.js";

/** A rule a fallback insight entry must pass. Check returns its problems, or none. */
export interface FallbackInsightEntryRule {
  check(item: FallbackInsightEntry): string[];
}

export class FallbackInsightEntryCampaignRefLengthRule implements FallbackInsightEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInsightEntry): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackInsightEntryRequiredCategoryRule implements FallbackInsightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightEntry): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightEntryRequiredTitleRule implements FallbackInsightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightEntryCategoryLengthRule implements FallbackInsightEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInsightEntry): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackInsightEntryAllowedTitleRule implements FallbackInsightEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackInsightEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

/** Runs every rule of a fallback insight entry. */
export class FallbackInsightEntryValidator {
  rules: FallbackInsightEntryRule[];

  constructor(rules: FallbackInsightEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInsightEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackInsightEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInsightEntry[]): Map<string, string[]> {
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

export function defaultFallbackInsightEntryValidator(): FallbackInsightEntryValidator {
  return new FallbackInsightEntryValidator(
    [
      new FallbackInsightEntryCampaignRefLengthRule(32),
      new FallbackInsightEntryRequiredCategoryRule("fallback insight entry needs a value"),
      new FallbackInsightEntryRequiredTitleRule("fallback insight entry needs an entry"),
      new FallbackInsightEntryCategoryLengthRule(255),
      new FallbackInsightEntryAllowedTitleRule(["rolling", "adaptive"]),
    ],
  );
}
