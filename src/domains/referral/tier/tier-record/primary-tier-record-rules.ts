import * as text from "../../../../kit/text.js";
import { PrimaryTierRecord } from "./primary-tier-record.js";

/** A rule a primary tier record must pass. Check returns its problems, or none. */
export interface PrimaryTierRecordRule {
  check(item: PrimaryTierRecord): string[];
}

export class PrimaryTierRecordAllowedTitleRule implements PrimaryTierRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryTierRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class PrimaryTierRecordRevisionRangeRule implements PrimaryTierRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTierRecord): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryTierRecordRequiredCountryRule implements PrimaryTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTierRecord): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTierRecordRequiredCodeRule implements PrimaryTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTierRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTierRecordChecksumLengthRule implements PrimaryTierRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTierRecord): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTierRecordTitleLengthRule implements PrimaryTierRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTierRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary tier record. */
export class PrimaryTierRecordValidator {
  rules: PrimaryTierRecordRule[];

  constructor(rules: PrimaryTierRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTierRecord): string[] {
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

  requireValid(item: PrimaryTierRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTierRecord[]): Map<string, string[]> {
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

export function defaultPrimaryTierRecordValidator(): PrimaryTierRecordValidator {
  return new PrimaryTierRecordValidator(
    [
      new PrimaryTierRecordAllowedTitleRule(["tiered"]),
      new PrimaryTierRecordRevisionRangeRule(16, 80),
      new PrimaryTierRecordRequiredCountryRule("primary tier record needs this field"),
      new PrimaryTierRecordRequiredCodeRule("primary tier record needs this field"),
      new PrimaryTierRecordChecksumLengthRule(16),
      new PrimaryTierRecordTitleLengthRule(86400),
    ],
  );
}
