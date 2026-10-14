import { CsatRecord } from "./csat-record.js";

/** A rule a csat record must pass. Check returns its problems, or none. */
export interface CsatRecordRule {
  check(item: CsatRecord): string[];
}

export class CsatRecordRequiredCodeRule implements CsatRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatRecordVisibleGuardRule implements CsatRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatRecord): string[] {
    if (item.visible && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CsatRecordCodePrefixRule implements CsatRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatRecordReviewerLengthRule implements CsatRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatRecord): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatRecordRequiredUtmSourceRule implements CsatRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatRecord): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class CsatRecordRequiredReviewerRule implements CsatRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatRecord): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat record. */
export class CsatRecordValidator {
  rules: CsatRecordRule[];

  constructor(rules: CsatRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CsatRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatRecord[]): Map<string, string[]> {
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

export function defaultCsatRecordValidator(): CsatRecordValidator {
  return new CsatRecordValidator(
    [
      new CsatRecordRequiredCodeRule("csat record needs this field"),
      new CsatRecordVisibleGuardRule(8.8),
      new CsatRecordCodePrefixRule("REF"),
      new CsatRecordReviewerLengthRule(16),
      new CsatRecordRequiredUtmSourceRule("csat record needs a value"),
      new CsatRecordRequiredReviewerRule("csat record needs an entry"),
    ],
  );
}
