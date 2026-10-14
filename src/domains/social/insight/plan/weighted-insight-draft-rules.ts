import { WeightedInsightDraft } from "./weighted-insight-draft.js";

/** A rule a weighted insight draft must pass. Check returns its problems, or none. */
export interface WeightedInsightDraftRule {
  check(item: WeightedInsightDraft): string[];
}

export class WeightedInsightDraftLabelLengthRule implements WeightedInsightDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightDraftScoreRangeRule implements WeightedInsightDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInsightDraft): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedInsightDraftRequiredLocaleRule implements WeightedInsightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightDraft): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInsightDraftCodePrefixRule implements WeightedInsightDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedInsightDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedInsightDraftRequiredReviewerRule implements WeightedInsightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightDraft): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted insight draft. */
export class WeightedInsightDraftValidator {
  rules: WeightedInsightDraftRule[];

  constructor(rules: WeightedInsightDraftRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInsightDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedInsightDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInsightDraft[]): Map<string, string[]> {
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

export function defaultWeightedInsightDraftValidator(): WeightedInsightDraftValidator {
  return new WeightedInsightDraftValidator(
    [
      new WeightedInsightDraftLabelLengthRule(64),
      new WeightedInsightDraftScoreRangeRule(9.3, 3353.4),
      new WeightedInsightDraftRequiredLocaleRule("weighted insight draft needs a value"),
      new WeightedInsightDraftCodePrefixRule("X"),
      new WeightedInsightDraftRequiredReviewerRule("weighted insight draft needs an entry"),
    ],
  );
}
