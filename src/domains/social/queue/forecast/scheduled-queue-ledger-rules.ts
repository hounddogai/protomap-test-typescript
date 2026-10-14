import * as text from "../../../../kit/text.js";
import { ScheduledQueueLedger } from "./scheduled-queue-ledger.js";

/** A rule a scheduled queue ledger must pass. Check returns its problems, or none. */
export interface ScheduledQueueLedgerRule {
  check(item: ScheduledQueueLedger): string[];
}

export class ScheduledQueueLedgerCodeLengthRule implements ScheduledQueueLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledQueueLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledQueueLedgerRequiredNameRule implements ScheduledQueueLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledQueueLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledQueueLedgerRequiredNotesRule implements ScheduledQueueLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledQueueLedger): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledQueueLedgerThresholdRangeRule implements ScheduledQueueLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledQueueLedger): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledQueueLedgerAllowedNameRule implements ScheduledQueueLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledQueueLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class ScheduledQueueLedgerCodePrefixRule implements ScheduledQueueLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledQueueLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled queue ledger. */
export class ScheduledQueueLedgerValidator {
  rules: ScheduledQueueLedgerRule[];

  constructor(rules: ScheduledQueueLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledQueueLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledQueueLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledQueueLedger[]): Map<string, string[]> {
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

export function defaultScheduledQueueLedgerValidator(): ScheduledQueueLedgerValidator {
  return new ScheduledQueueLedgerValidator(
    [
      new ScheduledQueueLedgerCodeLengthRule(3600),
      new ScheduledQueueLedgerRequiredNameRule("scheduled queue ledger needs this field"),
      new ScheduledQueueLedgerRequiredNotesRule("scheduled queue ledger needs an entry"),
      new ScheduledQueueLedgerThresholdRangeRule(3.6, 1871.1),
      new ScheduledQueueLedgerAllowedNameRule(["tiered"]),
      new ScheduledQueueLedgerCodePrefixRule("OPS"),
    ],
  );
}
