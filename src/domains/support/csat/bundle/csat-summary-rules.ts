import { CsatSummary } from "./csat-summary.js";

/** A rule a csat summary must pass. Check returns its problems, or none. */
export interface CsatSummaryRule {
  check(item: CsatSummary): string[];
}

export class CsatSummaryLabelLengthRule implements CsatSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatSummaryPinnedGuardRule implements CsatSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatSummary): string[] {
    if (item.pinned && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class CsatSummaryRequiredReviewerRule implements CsatSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatSummary): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat summary. */
export class CsatSummaryValidator {
  rules: CsatSummaryRule[];

  constructor(rules: CsatSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: CsatSummary): string[] {
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

  requireValid(item: CsatSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatSummary[]): Map<string, string[]> {
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

export function defaultCsatSummaryValidator(): CsatSummaryValidator {
  return new CsatSummaryValidator(
    [
      new CsatSummaryLabelLengthRule(16),
      new CsatSummaryPinnedGuardRule(0.9),
      new CsatSummaryRequiredReviewerRule("csat summary needs a value"),
    ],
  );
}
