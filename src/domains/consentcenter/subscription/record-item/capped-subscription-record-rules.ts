import { CappedSubscriptionRecord } from "./capped-subscription-record.js";

/** A rule a capped subscription record must pass. Check returns its problems, or none. */
export interface CappedSubscriptionRecordRule {
  check(item: CappedSubscriptionRecord): string[];
}

export class CappedSubscriptionRecordReviewerLengthRule implements CappedSubscriptionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSubscriptionRecord): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSubscriptionRecordCodePrefixRule implements CappedSubscriptionRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedSubscriptionRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedSubscriptionRecordRequiredReviewerRule implements CappedSubscriptionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSubscriptionRecord): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSubscriptionRecordRequiredTitleRule implements CappedSubscriptionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSubscriptionRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSubscriptionRecordRequiredCodeRule implements CappedSubscriptionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSubscriptionRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped subscription record. */
export class CappedSubscriptionRecordValidator {
  rules: CappedSubscriptionRecordRule[];

  constructor(rules: CappedSubscriptionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSubscriptionRecord): string[] {
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

  requireValid(item: CappedSubscriptionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSubscriptionRecord[]): Map<string, string[]> {
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

export function defaultCappedSubscriptionRecordValidator(): CappedSubscriptionRecordValidator {
  return new CappedSubscriptionRecordValidator(
    [
      new CappedSubscriptionRecordReviewerLengthRule(16),
      new CappedSubscriptionRecordCodePrefixRule("REF"),
      new CappedSubscriptionRecordRequiredReviewerRule("capped subscription record needs an entry"),
      new CappedSubscriptionRecordRequiredTitleRule("capped subscription record needs an entry"),
      new CappedSubscriptionRecordRequiredCodeRule("capped subscription record needs this field"),
    ],
  );
}
