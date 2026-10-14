import * as text from "../../../../kit/text.js";
import { ScheduledSenderEntry } from "./scheduled-sender-entry.js";

/** A rule a scheduled sender entry must pass. Check returns its problems, or none. */
export interface ScheduledSenderEntryRule {
  check(item: ScheduledSenderEntry): string[];
}

export class ScheduledSenderEntryRequiredJourneyIdRule implements ScheduledSenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSenderEntry): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSenderEntryBatchSizeRangeRule implements ScheduledSenderEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSenderEntry): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSenderEntryAllowedNameRule implements ScheduledSenderEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSenderEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class ScheduledSenderEntryCodeLengthRule implements ScheduledSenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSenderEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSenderEntryJourneyIdLengthRule implements ScheduledSenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSenderEntry): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled sender entry. */
export class ScheduledSenderEntryValidator {
  rules: ScheduledSenderEntryRule[];

  constructor(rules: ScheduledSenderEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSenderEntry): string[] {
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

  requireValid(item: ScheduledSenderEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSenderEntry[]): Map<string, string[]> {
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

export function defaultScheduledSenderEntryValidator(): ScheduledSenderEntryValidator {
  return new ScheduledSenderEntryValidator(
    [
      new ScheduledSenderEntryRequiredJourneyIdRule("scheduled sender entry needs an entry"),
      new ScheduledSenderEntryBatchSizeRangeRule(120, 86400),
      new ScheduledSenderEntryAllowedNameRule(["tiered", "fallback", "pending"]),
      new ScheduledSenderEntryCodeLengthRule(80),
      new ScheduledSenderEntryJourneyIdLengthRule(3600),
    ],
  );
}
