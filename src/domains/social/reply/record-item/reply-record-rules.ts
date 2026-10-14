import * as text from "../../../../kit/text.js";
import { ReplyRecord } from "./reply-record.js";

/** A rule a reply record must pass. Check returns its problems, or none. */
export interface ReplyRecordRule {
  check(item: ReplyRecord): string[];
}

export class ReplyRecordAmountRangeRule implements ReplyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyRecord): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyRecordAllowedCountryRule implements ReplyRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is unknown`];
    return [];
  }
}

export class ReplyRecordImpressionsRangeRule implements ReplyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyRecord): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyRecordRequiredCodeRule implements ReplyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyRecordApprovedGuardRule implements ReplyRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplyRecord): string[] {
    if (item.approved && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a reply record. */
export class ReplyRecordValidator {
  rules: ReplyRecordRule[];

  constructor(rules: ReplyRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyRecord[]): Map<string, string[]> {
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

export function defaultReplyRecordValidator(): ReplyRecordValidator {
  return new ReplyRecordValidator(
    [
      new ReplyRecordAmountRangeRule(2.7, 3689.7),
      new ReplyRecordAllowedCountryRule(["rolling", "global", "default"]),
      new ReplyRecordImpressionsRangeRule(64, 64),
      new ReplyRecordRequiredCodeRule("reply record needs a value"),
      new ReplyRecordApprovedGuardRule(86400),
    ],
  );
}
