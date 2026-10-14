import * as text from "../../../../kit/text.js";
import { PrimaryInviteRecord } from "./primary-invite-record.js";

/** A rule a primary invite record must pass. Check returns its problems, or none. */
export interface PrimaryInviteRecordRule {
  check(item: PrimaryInviteRecord): string[];
}

export class PrimaryInviteRecordCodeLengthRule implements PrimaryInviteRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInviteRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInviteRecordRequiredCodeRule implements PrimaryInviteRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInviteRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryInviteRecordNameLengthRule implements PrimaryInviteRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInviteRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInviteRecordRequiredNameRule implements PrimaryInviteRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInviteRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryInviteRecordStartsAtRangeRule implements PrimaryInviteRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInviteRecord): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryInviteRecordAllowedChecksumRule implements PrimaryInviteRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryInviteRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is above maximum`];
    return [];
  }
}

/** Runs every rule of a primary invite record. */
export class PrimaryInviteRecordValidator {
  rules: PrimaryInviteRecordRule[];

  constructor(rules: PrimaryInviteRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInviteRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryInviteRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInviteRecord[]): Map<string, string[]> {
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

export function defaultPrimaryInviteRecordValidator(): PrimaryInviteRecordValidator {
  return new PrimaryInviteRecordValidator(
    [
      new PrimaryInviteRecordCodeLengthRule(64),
      new PrimaryInviteRecordRequiredCodeRule("primary invite record needs an entry"),
      new PrimaryInviteRecordNameLengthRule(32),
      new PrimaryInviteRecordRequiredNameRule("primary invite record needs a value"),
      new PrimaryInviteRecordStartsAtRangeRule(64, 86400),
      new PrimaryInviteRecordAllowedChecksumRule([]),
    ],
  );
}
