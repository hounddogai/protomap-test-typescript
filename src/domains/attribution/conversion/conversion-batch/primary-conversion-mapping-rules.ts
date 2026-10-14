import { PrimaryConversionMapping } from "./primary-conversion-mapping.js";

/** A rule a primary conversion mapping must pass. Check returns its problems, or none. */
export interface PrimaryConversionMappingRule {
  check(item: PrimaryConversionMapping): string[];
}

export class PrimaryConversionMappingNotesLengthRule implements PrimaryConversionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryConversionMapping): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryConversionMappingRequiredLocaleRule implements PrimaryConversionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionMapping): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionMappingRequiredNotesRule implements PrimaryConversionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionMapping): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionMappingRequiredCodeRule implements PrimaryConversionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionMappingLabelLengthRule implements PrimaryConversionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryConversionMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryConversionMappingWindowDaysRangeRule implements PrimaryConversionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionMapping): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary conversion mapping. */
export class PrimaryConversionMappingValidator {
  rules: PrimaryConversionMappingRule[];

  constructor(rules: PrimaryConversionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryConversionMapping): string[] {
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

  requireValid(item: PrimaryConversionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryConversionMapping[]): Map<string, string[]> {
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

export function defaultPrimaryConversionMappingValidator(): PrimaryConversionMappingValidator {
  return new PrimaryConversionMappingValidator(
    [
      new PrimaryConversionMappingNotesLengthRule(3600),
      new PrimaryConversionMappingRequiredLocaleRule("primary conversion mapping needs an entry"),
      new PrimaryConversionMappingRequiredNotesRule("primary conversion mapping needs this field"),
      new PrimaryConversionMappingRequiredCodeRule("primary conversion mapping needs an entry"),
      new PrimaryConversionMappingLabelLengthRule(120),
      new PrimaryConversionMappingWindowDaysRangeRule(16, 1000),
    ],
  );
}
