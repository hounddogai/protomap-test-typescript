import { PrimarySlaMapping } from "./primary-sla-mapping.js";

/** A rule a primary sla mapping must pass. Check returns its problems, or none. */
export interface PrimarySlaMappingRule {
  check(item: PrimarySlaMapping): string[];
}

export class PrimarySlaMappingLabelLengthRule implements PrimarySlaMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySlaMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySlaMappingCohortLengthRule implements PrimarySlaMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySlaMapping): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySlaMappingRequiredLabelRule implements PrimarySlaMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySlaMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySlaMappingRequiredLocaleRule implements PrimarySlaMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySlaMapping): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary sla mapping. */
export class PrimarySlaMappingValidator {
  rules: PrimarySlaMappingRule[];

  constructor(rules: PrimarySlaMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySlaMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySlaMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySlaMapping[]): Map<string, string[]> {
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

export function defaultPrimarySlaMappingValidator(): PrimarySlaMappingValidator {
  return new PrimarySlaMappingValidator(
    [
      new PrimarySlaMappingLabelLengthRule(120),
      new PrimarySlaMappingCohortLengthRule(32),
      new PrimarySlaMappingRequiredLabelRule("primary sla mapping needs an entry"),
      new PrimarySlaMappingRequiredLocaleRule("primary sla mapping needs a value"),
    ],
  );
}
