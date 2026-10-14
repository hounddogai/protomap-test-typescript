import * as text from "../../../../kit/text.js";
import { PendingCohortTemplate } from "./pending-cohort-template.js";

/** A rule a pending cohort template must pass. Check returns its problems, or none. */
export interface PendingCohortTemplateRule {
  check(item: PendingCohortTemplate): string[];
}

export class PendingCohortTemplateTimezoneLengthRule implements PendingCohortTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCohortTemplate): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCohortTemplateCountryLengthRule implements PendingCohortTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCohortTemplate): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCohortTemplateAllowedCountryRule implements PendingCohortTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingCohortTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is too long`];
    return [];
  }
}

export class PendingCohortTemplateCapacityRangeRule implements PendingCohortTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortTemplate): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending cohort template. */
export class PendingCohortTemplateValidator {
  rules: PendingCohortTemplateRule[];

  constructor(rules: PendingCohortTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCohortTemplate): string[] {
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

  requireValid(item: PendingCohortTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCohortTemplate[]): Map<string, string[]> {
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

export function defaultPendingCohortTemplateValidator(): PendingCohortTemplateValidator {
  return new PendingCohortTemplateValidator(
    [
      new PendingCohortTemplateTimezoneLengthRule(80),
      new PendingCohortTemplateCountryLengthRule(120),
      new PendingCohortTemplateAllowedCountryRule([]),
      new PendingCohortTemplateCapacityRangeRule(120, 86400),
    ],
  );
}
