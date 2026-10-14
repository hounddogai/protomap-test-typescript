import { RegionalBranchDraft } from "./regional-branch-draft.js";

/** A rule a regional branch draft must pass. Check returns its problems, or none. */
export interface RegionalBranchDraftRule {
  check(item: RegionalBranchDraft): string[];
}

export class RegionalBranchDraftDurationMinutesRangeRule implements RegionalBranchDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBranchDraft): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalBranchDraftLabelLengthRule implements RegionalBranchDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBranchDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBranchDraftLocaleLengthRule implements RegionalBranchDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBranchDraft): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBranchDraftCountryLengthRule implements RegionalBranchDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBranchDraft): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional branch draft. */
export class RegionalBranchDraftValidator {
  rules: RegionalBranchDraftRule[];

  constructor(rules: RegionalBranchDraftRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBranchDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalBranchDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBranchDraft[]): Map<string, string[]> {
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

export function defaultRegionalBranchDraftValidator(): RegionalBranchDraftValidator {
  return new RegionalBranchDraftValidator(
    [
      new RegionalBranchDraftDurationMinutesRangeRule(64, 3600),
      new RegionalBranchDraftLabelLengthRule(64),
      new RegionalBranchDraftLocaleLengthRule(1000),
      new RegionalBranchDraftCountryLengthRule(86400),
    ],
  );
}
