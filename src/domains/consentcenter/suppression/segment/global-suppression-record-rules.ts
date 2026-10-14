import * as text from "../../../../kit/text.js";
import { GlobalSuppressionRecord } from "./global-suppression-record.js";

/** A rule a global suppression record must pass. Check returns its problems, or none. */
export interface GlobalSuppressionRecordRule {
  check(item: GlobalSuppressionRecord): string[];
}

export class GlobalSuppressionRecordRequiredNameRule implements GlobalSuppressionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSuppressionRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSuppressionRecordConversionRateRangeRule implements GlobalSuppressionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionRecord): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSuppressionRecordSourceLengthRule implements GlobalSuppressionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSuppressionRecord): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSuppressionRecordAllowedSourceRule implements GlobalSuppressionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSuppressionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is blocked`];
    return [];
  }
}

export class GlobalSuppressionRecordRequiredCodeRule implements GlobalSuppressionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSuppressionRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global suppression record. */
export class GlobalSuppressionRecordValidator {
  rules: GlobalSuppressionRecordRule[];

  constructor(rules: GlobalSuppressionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSuppressionRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSuppressionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSuppressionRecord[]): Map<string, string[]> {
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

export function defaultGlobalSuppressionRecordValidator(): GlobalSuppressionRecordValidator {
  return new GlobalSuppressionRecordValidator(
    [
      new GlobalSuppressionRecordRequiredNameRule("global suppression record needs a value"),
      new GlobalSuppressionRecordConversionRateRangeRule(3.5, 2228.2),
      new GlobalSuppressionRecordSourceLengthRule(120),
      new GlobalSuppressionRecordAllowedSourceRule([]),
      new GlobalSuppressionRecordRequiredCodeRule("global suppression record needs an entry"),
    ],
  );
}
