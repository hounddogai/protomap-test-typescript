import * as text from "../../../../kit/text.js";
import { StepSummary } from "./step-summary.js";

/** A rule a step summary must pass. Check returns its problems, or none. */
export interface StepSummaryRule {
  check(item: StepSummary): string[];
}

export class StepSummaryAllowedReviewerRule implements StepSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is below minimum`];
    return [];
  }
}

export class StepSummaryVariantLengthRule implements StepSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSummary): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepSummaryRequiredVariantRule implements StepSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepSummary): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step summary. */
export class StepSummaryValidator {
  rules: StepSummaryRule[];

  constructor(rules: StepSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: StepSummary): string[] {
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

  requireValid(item: StepSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepSummary[]): Map<string, string[]> {
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

export function defaultStepSummaryValidator(): StepSummaryValidator {
  return new StepSummaryValidator(
    [
      new StepSummaryAllowedReviewerRule([]),
      new StepSummaryVariantLengthRule(3600),
      new StepSummaryRequiredVariantRule("step summary needs an entry"),
    ],
  );
}
