import * as text from "../../../../kit/text.js";
import { ModelDraft } from "./model-draft.js";

/** A rule a model draft must pass. Check returns its problems, or none. */
export interface ModelDraftRule {
  check(item: ModelDraft): string[];
}

export class ModelDraftRequiredVariantRule implements ModelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelDraft): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ModelDraftMarginRangeRule implements ModelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelDraft): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelDraftAllowedVariantRule implements ModelDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is above maximum`];
    return [];
  }
}

export class ModelDraftRequiredTitleRule implements ModelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model draft. */
export class ModelDraftValidator {
  rules: ModelDraftRule[];

  constructor(rules: ModelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ModelDraft): string[] {
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

  requireValid(item: ModelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelDraft[]): Map<string, string[]> {
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

export function defaultModelDraftValidator(): ModelDraftValidator {
  return new ModelDraftValidator(
    [
      new ModelDraftRequiredVariantRule("model draft needs an entry"),
      new ModelDraftMarginRangeRule(6.2, 701.4),
      new ModelDraftAllowedVariantRule([]),
      new ModelDraftRequiredTitleRule("model draft needs this field"),
    ],
  );
}
