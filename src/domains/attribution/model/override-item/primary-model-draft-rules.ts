import * as text from "../../../../kit/text.js";
import { PrimaryModelDraft } from "./primary-model-draft.js";

/** A rule a primary model draft must pass. Check returns its problems, or none. */
export interface PrimaryModelDraftRule {
  check(item: PrimaryModelDraft): string[];
}

export class PrimaryModelDraftRequiredSegmentRule implements PrimaryModelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryModelDraft): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryModelDraftAllowedTitleRule implements PrimaryModelDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryModelDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class PrimaryModelDraftRequiredTitleRule implements PrimaryModelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryModelDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryModelDraftRequiredCodeRule implements PrimaryModelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryModelDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryModelDraftMarginRangeRule implements PrimaryModelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryModelDraft): string[] {
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

export class PrimaryModelDraftSegmentLengthRule implements PrimaryModelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryModelDraft): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary model draft. */
export class PrimaryModelDraftValidator {
  rules: PrimaryModelDraftRule[];

  constructor(rules: PrimaryModelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryModelDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryModelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryModelDraft[]): Map<string, string[]> {
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

export function defaultPrimaryModelDraftValidator(): PrimaryModelDraftValidator {
  return new PrimaryModelDraftValidator(
    [
      new PrimaryModelDraftRequiredSegmentRule("primary model draft needs an entry"),
      new PrimaryModelDraftAllowedTitleRule(["lenient"]),
      new PrimaryModelDraftRequiredTitleRule("primary model draft needs an entry"),
      new PrimaryModelDraftRequiredCodeRule("primary model draft needs this field"),
      new PrimaryModelDraftMarginRangeRule(9.8, 3426),
      new PrimaryModelDraftSegmentLengthRule(80),
    ],
  );
}
