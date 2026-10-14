import * as text from "../../../../kit/text.js";
import { SuppressionDraft } from "./suppression-draft.js";

/** A rule a suppression draft must pass. Check returns its problems, or none. */
export interface SuppressionDraftRule {
  check(item: SuppressionDraft): string[];
}

export class SuppressionDraftRequiredTitleRule implements SuppressionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionDraftCodePrefixRule implements SuppressionDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionDraftTitleLengthRule implements SuppressionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionDraftConversionRateRangeRule implements SuppressionDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionDraft): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionDraftAllowedExternalRefRule implements SuppressionDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is below minimum`];
    return [];
  }
}

export class SuppressionDraftExternalRefLengthRule implements SuppressionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionDraft): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression draft. */
export class SuppressionDraftValidator {
  rules: SuppressionDraftRule[];

  constructor(rules: SuppressionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionDraft[]): Map<string, string[]> {
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

export function defaultSuppressionDraftValidator(): SuppressionDraftValidator {
  return new SuppressionDraftValidator(
    [
      new SuppressionDraftRequiredTitleRule("suppression draft needs this field"),
      new SuppressionDraftCodePrefixRule("Q"),
      new SuppressionDraftTitleLengthRule(3600),
      new SuppressionDraftConversionRateRangeRule(3.9, 96.5),
      new SuppressionDraftAllowedExternalRefRule(["default"]),
      new SuppressionDraftExternalRefLengthRule(64),
    ],
  );
}
