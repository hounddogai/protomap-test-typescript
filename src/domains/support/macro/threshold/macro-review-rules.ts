import * as text from "../../../../kit/text.js";
import { MacroReview } from "./macro-review.js";

/** A rule a macro review must pass. Check returns its problems, or none. */
export interface MacroReviewRule {
  check(item: MacroReview): string[];
}

export class MacroReviewRequiredCodeRule implements MacroReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroReviewAllowedCountryRule implements MacroReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is too long`];
    return [];
  }
}

export class MacroReviewCodeLengthRule implements MacroReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroReviewRequiredLabelRule implements MacroReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro review. */
export class MacroReviewValidator {
  rules: MacroReviewRule[];

  constructor(rules: MacroReviewRule[]) {
    this.rules = rules;
  }

  validate(item: MacroReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroReview[]): Map<string, string[]> {
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

export function defaultMacroReviewValidator(): MacroReviewValidator {
  return new MacroReviewValidator(
    [
      new MacroReviewRequiredCodeRule("macro review needs a value"),
      new MacroReviewAllowedCountryRule(["strict", "seasonal", "default"]),
      new MacroReviewCodeLengthRule(86400),
      new MacroReviewRequiredLabelRule("macro review needs a value"),
    ],
  );
}
