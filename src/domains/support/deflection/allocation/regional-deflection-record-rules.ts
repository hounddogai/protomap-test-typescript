import { RegionalDeflectionRecord } from "./regional-deflection-record.js";

/** A rule a regional deflection record must pass. Check returns its problems, or none. */
export interface RegionalDeflectionRecordRule {
  check(item: RegionalDeflectionRecord): string[];
}

export class RegionalDeflectionRecordCodePrefixRule implements RegionalDeflectionRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalDeflectionRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalDeflectionRecordRequiredLabelRule implements RegionalDeflectionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDeflectionRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDeflectionRecordLabelLengthRule implements RegionalDeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDeflectionRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalDeflectionRecordPhoneLengthRule implements RegionalDeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDeflectionRecord): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional deflection record. */
export class RegionalDeflectionRecordValidator {
  rules: RegionalDeflectionRecordRule[];

  constructor(rules: RegionalDeflectionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalDeflectionRecord): string[] {
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

  requireValid(item: RegionalDeflectionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalDeflectionRecord[]): Map<string, string[]> {
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

export function defaultRegionalDeflectionRecordValidator(): RegionalDeflectionRecordValidator {
  return new RegionalDeflectionRecordValidator(
    [
      new RegionalDeflectionRecordCodePrefixRule("OPS"),
      new RegionalDeflectionRecordRequiredLabelRule("regional deflection record needs this field"),
      new RegionalDeflectionRecordLabelLengthRule(32),
      new RegionalDeflectionRecordPhoneLengthRule(255),
    ],
  );
}
