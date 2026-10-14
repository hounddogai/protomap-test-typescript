import * as text from "../../../../kit/text.js";
import { BatchedJourneyTemplate } from "./batched-journey-template.js";

/** A rule a batched journey template must pass. Check returns its problems, or none. */
export interface BatchedJourneyTemplateRule {
  check(item: BatchedJourneyTemplate): string[];
}

export class BatchedJourneyTemplateRequiredTitleRule implements BatchedJourneyTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedJourneyTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedJourneyTemplateWeightRangeRule implements BatchedJourneyTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyTemplate): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedJourneyTemplateAllowedCountryRule implements BatchedJourneyTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedJourneyTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is above maximum`];
    return [];
  }
}

/** Runs every rule of a batched journey template. */
export class BatchedJourneyTemplateValidator {
  rules: BatchedJourneyTemplateRule[];

  constructor(rules: BatchedJourneyTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedJourneyTemplate): string[] {
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

  requireValid(item: BatchedJourneyTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedJourneyTemplate[]): Map<string, string[]> {
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

export function defaultBatchedJourneyTemplateValidator(): BatchedJourneyTemplateValidator {
  return new BatchedJourneyTemplateValidator(
    [
      new BatchedJourneyTemplateRequiredTitleRule("batched journey template needs an entry"),
      new BatchedJourneyTemplateWeightRangeRule(1.7, 4500.8),
      new BatchedJourneyTemplateAllowedCountryRule(["default", "lenient", "tiered"]),
    ],
  );
}
