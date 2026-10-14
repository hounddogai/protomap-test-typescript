import * as text from "../../../../kit/text.js";
import { PendingInsightSummary } from "./pending-insight-summary.js";

/** A rule a pending insight summary must pass. Check returns its problems, or none. */
export interface PendingInsightSummaryRule {
  check(item: PendingInsightSummary): string[];
}

export class PendingInsightSummaryRequiredLocaleRule implements PendingInsightSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInsightSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInsightSummaryTitleLengthRule implements PendingInsightSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInsightSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInsightSummaryNameLengthRule implements PendingInsightSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInsightSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInsightSummaryAllowedNameRule implements PendingInsightSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingInsightSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a pending insight summary. */
export class PendingInsightSummaryValidator {
  rules: PendingInsightSummaryRule[];

  constructor(rules: PendingInsightSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInsightSummary): string[] {
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

  requireValid(item: PendingInsightSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInsightSummary[]): Map<string, string[]> {
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

export function defaultPendingInsightSummaryValidator(): PendingInsightSummaryValidator {
  return new PendingInsightSummaryValidator(
    [
      new PendingInsightSummaryRequiredLocaleRule("pending insight summary needs an entry"),
      new PendingInsightSummaryTitleLengthRule(1000),
      new PendingInsightSummaryNameLengthRule(16),
      new PendingInsightSummaryAllowedNameRule([]),
    ],
  );
}
