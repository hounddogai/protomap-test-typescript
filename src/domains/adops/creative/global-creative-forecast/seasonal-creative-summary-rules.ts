import * as text from "../../../../kit/text.js";
import { SeasonalCreativeSummary } from "./seasonal-creative-summary.js";

/** A rule a seasonal creative summary must pass. Check returns its problems, or none. */
export interface SeasonalCreativeSummaryRule {
  check(item: SeasonalCreativeSummary): string[];
}

export class SeasonalCreativeSummaryRequiredCodeRule implements SeasonalCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCreativeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCreativeSummaryAttemptsRangeRule implements SeasonalCreativeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeSummary): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalCreativeSummaryCodeLengthRule implements SeasonalCreativeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCreativeSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCreativeSummaryAllowedTitleRule implements SeasonalCreativeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalCreativeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class SeasonalCreativeSummaryRequiredTitleRule implements SeasonalCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCreativeSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal creative summary. */
export class SeasonalCreativeSummaryValidator {
  rules: SeasonalCreativeSummaryRule[];

  constructor(rules: SeasonalCreativeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCreativeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalCreativeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCreativeSummary[]): Map<string, string[]> {
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

export function defaultSeasonalCreativeSummaryValidator(): SeasonalCreativeSummaryValidator {
  return new SeasonalCreativeSummaryValidator(
    [
      new SeasonalCreativeSummaryRequiredCodeRule("seasonal creative summary needs a value"),
      new SeasonalCreativeSummaryAttemptsRangeRule(32, 64),
      new SeasonalCreativeSummaryCodeLengthRule(255),
      new SeasonalCreativeSummaryAllowedTitleRule(["pending", "strict", "capped"]),
      new SeasonalCreativeSummaryRequiredTitleRule("seasonal creative summary needs this field"),
    ],
  );
}
