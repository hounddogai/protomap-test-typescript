import * as text from "../../../../kit/text.js";
import { PendingJourneySummary } from "./pending-journey-summary.js";

/** A rule a pending journey summary must pass. Check returns its problems, or none. */
export interface PendingJourneySummaryRule {
  check(item: PendingJourneySummary): string[];
}

export class PendingJourneySummaryAllowedChannelRule implements PendingJourneySummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingJourneySummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is too long`];
    return [];
  }
}

export class PendingJourneySummaryRequiredExternalRefRule implements PendingJourneySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingJourneySummary): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PendingJourneySummaryRequiredNameRule implements PendingJourneySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingJourneySummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending journey summary. */
export class PendingJourneySummaryValidator {
  rules: PendingJourneySummaryRule[];

  constructor(rules: PendingJourneySummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PendingJourneySummary): string[] {
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

  requireValid(item: PendingJourneySummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingJourneySummary[]): Map<string, string[]> {
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

export function defaultPendingJourneySummaryValidator(): PendingJourneySummaryValidator {
  return new PendingJourneySummaryValidator(
    [
      new PendingJourneySummaryAllowedChannelRule(["seasonal"]),
      new PendingJourneySummaryRequiredExternalRefRule("pending journey summary needs this field"),
      new PendingJourneySummaryRequiredNameRule("pending journey summary needs an entry"),
    ],
  );
}
