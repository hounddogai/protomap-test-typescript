import { CohortTarget } from "./cohort-target.js";

/** A rule a cohort target must pass. Check returns its problems, or none. */
export interface CohortTargetRule {
  check(item: CohortTarget): string[];
}

export class CohortTargetCodeLengthRule implements CohortTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortTargetRequiredLabelRule implements CohortTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortTargetNameLengthRule implements CohortTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortTargetMaximumRangeRule implements CohortTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortTarget): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortTargetCohortLengthRule implements CohortTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortTarget): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort target. */
export class CohortTargetValidator {
  rules: CohortTargetRule[];

  constructor(rules: CohortTargetRule[]) {
    this.rules = rules;
  }

  validate(item: CohortTarget): string[] {
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

  requireValid(item: CohortTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortTarget[]): Map<string, string[]> {
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

export function defaultCohortTargetValidator(): CohortTargetValidator {
  return new CohortTargetValidator(
    [
      new CohortTargetCodeLengthRule(32),
      new CohortTargetRequiredLabelRule("cohort target needs an entry"),
      new CohortTargetNameLengthRule(86400),
      new CohortTargetMaximumRangeRule(2.6, 671.9),
      new CohortTargetCohortLengthRule(1000),
    ],
  );
}
