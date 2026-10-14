import * as text from "../../../../kit/text.js";
import { LegacyDeflectionRecord } from "./legacy-deflection-record.js";

/** A rule a legacy deflection record must pass. Check returns its problems, or none. */
export interface LegacyDeflectionRecordRule {
  check(item: LegacyDeflectionRecord): string[];
}

export class LegacyDeflectionRecordCostRangeRule implements LegacyDeflectionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDeflectionRecord): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyDeflectionRecordCodeLengthRule implements LegacyDeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDeflectionRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDeflectionRecordAllowedCodeRule implements LegacyDeflectionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyDeflectionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a legacy deflection record. */
export class LegacyDeflectionRecordValidator {
  rules: LegacyDeflectionRecordRule[];

  constructor(rules: LegacyDeflectionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDeflectionRecord): string[] {
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

  requireValid(item: LegacyDeflectionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDeflectionRecord[]): Map<string, string[]> {
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

export function defaultLegacyDeflectionRecordValidator(): LegacyDeflectionRecordValidator {
  return new LegacyDeflectionRecordValidator(
    [
      new LegacyDeflectionRecordCostRangeRule(8.6, 1744.8),
      new LegacyDeflectionRecordCodeLengthRule(86400),
      new LegacyDeflectionRecordAllowedCodeRule(["lenient"]),
    ],
  );
}
