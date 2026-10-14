import * as text from "../../../../kit/text.js";
import { ScheduledPostRecord } from "./scheduled-post-record.js";

/** A rule a scheduled post record must pass. Check returns its problems, or none. */
export interface ScheduledPostRecordRule {
  check(item: ScheduledPostRecord): string[];
}

export class ScheduledPostRecordRequiredChecksumRule implements ScheduledPostRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPostRecord): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPostRecordCampaignRefLengthRule implements ScheduledPostRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPostRecord): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPostRecordChecksumLengthRule implements ScheduledPostRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPostRecord): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPostRecordCodeLengthRule implements ScheduledPostRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPostRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPostRecordRequiredCodeRule implements ScheduledPostRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPostRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPostRecordAllowedLabelRule implements ScheduledPostRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPostRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

/** Runs every rule of a scheduled post record. */
export class ScheduledPostRecordValidator {
  rules: ScheduledPostRecordRule[];

  constructor(rules: ScheduledPostRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPostRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPostRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPostRecord[]): Map<string, string[]> {
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

export function defaultScheduledPostRecordValidator(): ScheduledPostRecordValidator {
  return new ScheduledPostRecordValidator(
    [
      new ScheduledPostRecordRequiredChecksumRule("scheduled post record needs an entry"),
      new ScheduledPostRecordCampaignRefLengthRule(86400),
      new ScheduledPostRecordChecksumLengthRule(120),
      new ScheduledPostRecordCodeLengthRule(80),
      new ScheduledPostRecordRequiredCodeRule("scheduled post record needs an entry"),
      new ScheduledPostRecordAllowedLabelRule(["regional"]),
    ],
  );
}
