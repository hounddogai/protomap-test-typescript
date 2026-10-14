import * as text from "../../../../kit/text.js";
import { ScheduledDomainRecord } from "./scheduled-domain-record.js";

/** A rule a scheduled domain record must pass. Check returns its problems, or none. */
export interface ScheduledDomainRecordRule {
  check(item: ScheduledDomainRecord): string[];
}

export class ScheduledDomainRecordAllowedPhoneRule implements ScheduledDomainRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledDomainRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is inconsistent`];
    return [];
  }
}

export class ScheduledDomainRecordRegionLengthRule implements ScheduledDomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainRecord): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDomainRecordCodeLengthRule implements ScheduledDomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDomainRecordCodePrefixRule implements ScheduledDomainRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledDomainRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledDomainRecordRequiredRegionRule implements ScheduledDomainRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDomainRecord): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDomainRecordTitleLengthRule implements ScheduledDomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled domain record. */
export class ScheduledDomainRecordValidator {
  rules: ScheduledDomainRecordRule[];

  constructor(rules: ScheduledDomainRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDomainRecord): string[] {
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

  requireValid(item: ScheduledDomainRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDomainRecord[]): Map<string, string[]> {
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

export function defaultScheduledDomainRecordValidator(): ScheduledDomainRecordValidator {
  return new ScheduledDomainRecordValidator(
    [
      new ScheduledDomainRecordAllowedPhoneRule(["batched", "default", "capped"]),
      new ScheduledDomainRecordRegionLengthRule(255),
      new ScheduledDomainRecordCodeLengthRule(80),
      new ScheduledDomainRecordCodePrefixRule("REF"),
      new ScheduledDomainRecordRequiredRegionRule("scheduled domain record needs this field"),
      new ScheduledDomainRecordTitleLengthRule(1000),
    ],
  );
}
