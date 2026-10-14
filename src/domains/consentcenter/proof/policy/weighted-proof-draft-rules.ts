import * as text from "../../../../kit/text.js";
import { WeightedProofDraft } from "./weighted-proof-draft.js";

/** A rule a weighted proof draft must pass. Check returns its problems, or none. */
export interface WeightedProofDraftRule {
  check(item: WeightedProofDraft): string[];
}

export class WeightedProofDraftAllowedLabelRule implements WeightedProofDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedProofDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class WeightedProofDraftRequiredCategoryRule implements WeightedProofDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedProofDraft): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedProofDraftCategoryLengthRule implements WeightedProofDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedProofDraft): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedProofDraftCodeLengthRule implements WeightedProofDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedProofDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedProofDraftThresholdRangeRule implements WeightedProofDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedProofDraft): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedProofDraftClicksRangeRule implements WeightedProofDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedProofDraft): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted proof draft. */
export class WeightedProofDraftValidator {
  rules: WeightedProofDraftRule[];

  constructor(rules: WeightedProofDraftRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedProofDraft): string[] {
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

  requireValid(item: WeightedProofDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedProofDraft[]): Map<string, string[]> {
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

export function defaultWeightedProofDraftValidator(): WeightedProofDraftValidator {
  return new WeightedProofDraftValidator(
    [
      new WeightedProofDraftAllowedLabelRule(["scheduled", "batched"]),
      new WeightedProofDraftRequiredCategoryRule("weighted proof draft needs this field"),
      new WeightedProofDraftCategoryLengthRule(32),
      new WeightedProofDraftCodeLengthRule(64),
      new WeightedProofDraftThresholdRangeRule(7.4, 419.7),
      new WeightedProofDraftClicksRangeRule(255, 86400),
    ],
  );
}
