import * as text from "../../../../kit/text.js";
import { MacroSummary } from "./macro-summary.js";

/** A rule a macro summary must pass. Check returns its problems, or none. */
export interface MacroSummaryRule {
  check(item: MacroSummary): string[];
}

export class MacroSummaryRequiredLabelRule implements MacroSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MacroSummaryCohortLengthRule implements MacroSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroSummaryAllowedCohortRule implements MacroSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is below minimum`];
    return [];
  }
}

export class MacroSummaryRatioRangeRule implements MacroSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroSummary): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a macro summary. */
export class MacroSummaryValidator {
  rules: MacroSummaryRule[];

  constructor(rules: MacroSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: MacroSummary): string[] {
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

  requireValid(item: MacroSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroSummary[]): Map<string, string[]> {
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

export function defaultMacroSummaryValidator(): MacroSummaryValidator {
  return new MacroSummaryValidator(
    [
      new MacroSummaryRequiredLabelRule("macro summary needs this field"),
      new MacroSummaryCohortLengthRule(86400),
      new MacroSummaryAllowedCohortRule(["legacy", "seasonal"]),
      new MacroSummaryRatioRangeRule(8.4, 1110.9),
    ],
  );
}
