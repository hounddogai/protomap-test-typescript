import { ManualDomainRecord } from "./manual-domain-record.js";

/** A rule a manual domain record must pass. Check returns its problems, or none. */
export interface ManualDomainRecordRule {
  check(item: ManualDomainRecord): string[];
}

export class ManualDomainRecordCodeLengthRule implements ManualDomainRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualDomainRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualDomainRecordRequiredExternalRefRule implements ManualDomainRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualDomainRecord): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualDomainRecordCodePrefixRule implements ManualDomainRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualDomainRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual domain record. */
export class ManualDomainRecordValidator {
  rules: ManualDomainRecordRule[];

  constructor(rules: ManualDomainRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ManualDomainRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualDomainRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualDomainRecord[]): Map<string, string[]> {
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

export function defaultManualDomainRecordValidator(): ManualDomainRecordValidator {
  return new ManualDomainRecordValidator(
    [
      new ManualDomainRecordCodeLengthRule(86400),
      new ManualDomainRecordRequiredExternalRefRule("manual domain record needs an entry"),
      new ManualDomainRecordCodePrefixRule("Q"),
    ],
  );
}
