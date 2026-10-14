import * as text from "../../../../kit/text.js";
import { StrictDomainRecord } from "./strict-domain-record.js";

/** A rule a strict domain record must pass. Check returns its problems, or none. */
export interface StrictDomainRecordRule {
  check(item: StrictDomainRecord): string[];
}

export class StrictDomainRecordRequiredTitleRule implements StrictDomainRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDomainRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictDomainRecordCategoryLengthRule implements StrictDomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDomainRecord): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDomainRecordLabelLengthRule implements StrictDomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDomainRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDomainRecordAllowedCategoryRule implements StrictDomainRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictDomainRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is below minimum`];
    return [];
  }
}

export class StrictDomainRecordRequiredCategoryRule implements StrictDomainRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDomainRecord): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class StrictDomainRecordCodePrefixRule implements StrictDomainRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictDomainRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict domain record. */
export class StrictDomainRecordValidator {
  rules: StrictDomainRecordRule[];

  constructor(rules: StrictDomainRecordRule[]) {
    this.rules = rules;
  }

  validate(item: StrictDomainRecord): string[] {
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

  requireValid(item: StrictDomainRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictDomainRecord[]): Map<string, string[]> {
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

export function defaultStrictDomainRecordValidator(): StrictDomainRecordValidator {
  return new StrictDomainRecordValidator(
    [
      new StrictDomainRecordRequiredTitleRule("strict domain record needs this field"),
      new StrictDomainRecordCategoryLengthRule(32),
      new StrictDomainRecordLabelLengthRule(3600),
      new StrictDomainRecordAllowedCategoryRule(["scheduled", "capped"]),
      new StrictDomainRecordRequiredCategoryRule("strict domain record needs this field"),
      new StrictDomainRecordCodePrefixRule("Q"),
    ],
  );
}
