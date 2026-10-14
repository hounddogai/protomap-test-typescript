import * as text from "../../../../kit/text.js";
import { PendingWaitSummary } from "./pending-wait-summary.js";

/** A rule a pending wait summary must pass. Check returns its problems, or none. */
export interface PendingWaitSummaryRule {
  check(item: PendingWaitSummary): string[];
}

export class PendingWaitSummaryRequiredNameRule implements PendingWaitSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingWaitSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingWaitSummaryAllowedTitleRule implements PendingWaitSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingWaitSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class PendingWaitSummaryRequiredTitleRule implements PendingWaitSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingWaitSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending wait summary. */
export class PendingWaitSummaryValidator {
  rules: PendingWaitSummaryRule[];

  constructor(rules: PendingWaitSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PendingWaitSummary): string[] {
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

  requireValid(item: PendingWaitSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingWaitSummary[]): Map<string, string[]> {
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

export function defaultPendingWaitSummaryValidator(): PendingWaitSummaryValidator {
  return new PendingWaitSummaryValidator(
    [
      new PendingWaitSummaryRequiredNameRule("pending wait summary needs a value"),
      new PendingWaitSummaryAllowedTitleRule(["regional", "lenient"]),
      new PendingWaitSummaryRequiredTitleRule("pending wait summary needs this field"),
    ],
  );
}
