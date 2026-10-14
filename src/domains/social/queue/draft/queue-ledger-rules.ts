import * as text from "../../../../kit/text.js";
import { QueueLedger } from "./queue-ledger.js";

/** A rule a queue ledger must pass. Check returns its problems, or none. */
export interface QueueLedgerRule {
  check(item: QueueLedger): string[];
}

export class QueueLedgerRequiredCohortRule implements QueueLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueLedger): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class QueueLedgerCodePrefixRule implements QueueLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueLedgerRequiredCodeRule implements QueueLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueLedgerAllowedTitleRule implements QueueLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

/** Runs every rule of a queue ledger. */
export class QueueLedgerValidator {
  rules: QueueLedgerRule[];

  constructor(rules: QueueLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: QueueLedger): string[] {
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

  requireValid(item: QueueLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueLedger[]): Map<string, string[]> {
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

export function defaultQueueLedgerValidator(): QueueLedgerValidator {
  return new QueueLedgerValidator(
    [
      new QueueLedgerRequiredCohortRule("queue ledger needs this field"),
      new QueueLedgerCodePrefixRule("Q"),
      new QueueLedgerRequiredCodeRule("queue ledger needs this field"),
      new QueueLedgerAllowedTitleRule(["lenient", "scheduled", "batched"]),
    ],
  );
}
