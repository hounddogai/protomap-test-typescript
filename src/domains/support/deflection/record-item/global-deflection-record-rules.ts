import * as text from "../../../../kit/text.js";
import { GlobalDeflectionRecord } from "./global-deflection-record.js";

/** A rule a global deflection record must pass. Check returns its problems, or none. */
export interface GlobalDeflectionRecordRule {
  check(item: GlobalDeflectionRecord): string[];
}

export class GlobalDeflectionRecordRateRangeRule implements GlobalDeflectionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalDeflectionRecord): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalDeflectionRecordRequiredTitleRule implements GlobalDeflectionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionRecordTitleLengthRule implements GlobalDeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDeflectionRecordMaximumRangeRule implements GlobalDeflectionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalDeflectionRecord): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalDeflectionRecordAllowedCodeRule implements GlobalDeflectionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalDeflectionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

/** Runs every rule of a global deflection record. */
export class GlobalDeflectionRecordValidator {
  rules: GlobalDeflectionRecordRule[];

  constructor(rules: GlobalDeflectionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDeflectionRecord): string[] {
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

  requireValid(item: GlobalDeflectionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDeflectionRecord[]): Map<string, string[]> {
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

export function defaultGlobalDeflectionRecordValidator(): GlobalDeflectionRecordValidator {
  return new GlobalDeflectionRecordValidator(
    [
      new GlobalDeflectionRecordRateRangeRule(2.6, 870.2),
      new GlobalDeflectionRecordRequiredTitleRule("global deflection record needs a value"),
      new GlobalDeflectionRecordTitleLengthRule(16),
      new GlobalDeflectionRecordMaximumRangeRule(4.3, 4470.8),
      new GlobalDeflectionRecordAllowedCodeRule([]),
    ],
  );
}
