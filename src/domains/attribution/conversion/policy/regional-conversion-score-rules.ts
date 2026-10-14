import { RegionalConversionScore } from "./regional-conversion-score.js";

/** A rule a regional conversion score must pass. Check returns its problems, or none. */
export interface RegionalConversionScoreRule {
  check(item: RegionalConversionScore): string[];
}

export class RegionalConversionScoreRequiredLabelRule implements RegionalConversionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalConversionScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalConversionScoreGraceDaysRangeRule implements RegionalConversionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalConversionScore): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalConversionScoreRequiredNotesRule implements RegionalConversionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalConversionScore): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalConversionScoreCodeLengthRule implements RegionalConversionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalConversionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalConversionScoreNotesLengthRule implements RegionalConversionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalConversionScore): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional conversion score. */
export class RegionalConversionScoreValidator {
  rules: RegionalConversionScoreRule[];

  constructor(rules: RegionalConversionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalConversionScore): string[] {
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

  requireValid(item: RegionalConversionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalConversionScore[]): Map<string, string[]> {
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

export function defaultRegionalConversionScoreValidator(): RegionalConversionScoreValidator {
  return new RegionalConversionScoreValidator(
    [
      new RegionalConversionScoreRequiredLabelRule("regional conversion score needs this field"),
      new RegionalConversionScoreGraceDaysRangeRule(32, 255),
      new RegionalConversionScoreRequiredNotesRule("regional conversion score needs this field"),
      new RegionalConversionScoreCodeLengthRule(86400),
      new RegionalConversionScoreNotesLengthRule(255),
    ],
  );
}
