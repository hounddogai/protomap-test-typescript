import * as text from "../../../../kit/text.js";
import { DomainRecord } from "./domain-record.js";

/** A rule a domain record must pass. Check returns its problems, or none. */
export interface DomainRecordRule {
  check(item: DomainRecord): string[];
}

export class DomainRecordAllowedExternalRefRule implements DomainRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is missing`];
    return [];
  }
}

export class DomainRecordExternalRefLengthRule implements DomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainRecord): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainRecordLabelLengthRule implements DomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainRecordRequiredLabelRule implements DomainRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DomainRecordCodeLengthRule implements DomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain record. */
export class DomainRecordValidator {
  rules: DomainRecordRule[];

  constructor(rules: DomainRecordRule[]) {
    this.rules = rules;
  }

  validate(item: DomainRecord): string[] {
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

  requireValid(item: DomainRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainRecord[]): Map<string, string[]> {
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

export function defaultDomainRecordValidator(): DomainRecordValidator {
  return new DomainRecordValidator(
    [
      new DomainRecordAllowedExternalRefRule(["default"]),
      new DomainRecordExternalRefLengthRule(80),
      new DomainRecordLabelLengthRule(3600),
      new DomainRecordRequiredLabelRule("domain record needs an entry"),
      new DomainRecordCodeLengthRule(80),
    ],
  );
}
