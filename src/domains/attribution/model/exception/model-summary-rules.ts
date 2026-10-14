import * as text from "../../../../kit/text.js";
import { ModelSummary } from "./model-summary.js";

/** A rule a model summary must pass. Check returns its problems, or none. */
export interface ModelSummaryRule {
  check(item: ModelSummary): string[];
}

export class ModelSummaryAllowedTitleRule implements ModelSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class ModelSummaryCostRangeRule implements ModelSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelSummary): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelSummaryRequiredCodeRule implements ModelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelSummaryRequiredTitleRule implements ModelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ModelSummaryCodeLengthRule implements ModelSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelSummaryLabelLengthRule implements ModelSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model summary. */
export class ModelSummaryValidator {
  rules: ModelSummaryRule[];

  constructor(rules: ModelSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ModelSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelSummary[]): Map<string, string[]> {
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

export function defaultModelSummaryValidator(): ModelSummaryValidator {
  return new ModelSummaryValidator(
    [
      new ModelSummaryAllowedTitleRule(["capped", "legacy"]),
      new ModelSummaryCostRangeRule(1.2, 4342.4),
      new ModelSummaryRequiredCodeRule("model summary needs an entry"),
      new ModelSummaryRequiredTitleRule("model summary needs an entry"),
      new ModelSummaryCodeLengthRule(3600),
      new ModelSummaryLabelLengthRule(255),
    ],
  );
}
