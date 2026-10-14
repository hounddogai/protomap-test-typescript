import { CsatMapping } from "./csat-mapping.js";

/** A rule a csat mapping must pass. Check returns its problems, or none. */
export interface CsatMappingRule {
  check(item: CsatMapping): string[];
}

export class CsatMappingRequiredLocaleRule implements CsatMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatMapping): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CsatMappingAttemptsRangeRule implements CsatMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatMapping): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatMappingLocaleLengthRule implements CsatMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatMapping): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatMappingNameLengthRule implements CsatMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat mapping. */
export class CsatMappingValidator {
  rules: CsatMappingRule[];

  constructor(rules: CsatMappingRule[]) {
    this.rules = rules;
  }

  validate(item: CsatMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatMapping[]): Map<string, string[]> {
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

export function defaultCsatMappingValidator(): CsatMappingValidator {
  return new CsatMappingValidator(
    [
      new CsatMappingRequiredLocaleRule("csat mapping needs this field"),
      new CsatMappingAttemptsRangeRule(32, 86400),
      new CsatMappingLocaleLengthRule(1000),
      new CsatMappingNameLengthRule(120),
    ],
  );
}
