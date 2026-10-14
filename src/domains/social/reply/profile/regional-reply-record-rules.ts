import * as text from "../../../../kit/text.js";
import { RegionalReplyRecord } from "./regional-reply-record.js";

/** A rule a regional reply record must pass. Check returns its problems, or none. */
export interface RegionalReplyRecordRule {
  check(item: RegionalReplyRecord): string[];
}

export class RegionalReplyRecordRequiredCodeRule implements RegionalReplyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReplyRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReplyRecordAllowedTitleRule implements RegionalReplyRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalReplyRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class RegionalReplyRecordCodePrefixRule implements RegionalReplyRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalReplyRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalReplyRecordRequiredUtmSourceRule implements RegionalReplyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReplyRecord): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReplyRecordSequenceRangeRule implements RegionalReplyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReplyRecord): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalReplyRecordRequiredTitleRule implements RegionalReplyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReplyRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional reply record. */
export class RegionalReplyRecordValidator {
  rules: RegionalReplyRecordRule[];

  constructor(rules: RegionalReplyRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReplyRecord): string[] {
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

  requireValid(item: RegionalReplyRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReplyRecord[]): Map<string, string[]> {
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

export function defaultRegionalReplyRecordValidator(): RegionalReplyRecordValidator {
  return new RegionalReplyRecordValidator(
    [
      new RegionalReplyRecordRequiredCodeRule("regional reply record needs a value"),
      new RegionalReplyRecordAllowedTitleRule([]),
      new RegionalReplyRecordCodePrefixRule("Q"),
      new RegionalReplyRecordRequiredUtmSourceRule("regional reply record needs this field"),
      new RegionalReplyRecordSequenceRangeRule(16, 3600),
      new RegionalReplyRecordRequiredTitleRule("regional reply record needs this field"),
    ],
  );
}
