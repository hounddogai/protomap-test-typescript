import { SeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

/** A rule a seasonal complaint agreement must pass. Check returns its problems, or none. */
export interface SeasonalComplaintAgreementRule {
  check(item: SeasonalComplaintAgreement): string[];
}

export class SeasonalComplaintAgreementBudgetRangeRule implements SeasonalComplaintAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalComplaintAgreement): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalComplaintAgreementCodeLengthRule implements SeasonalComplaintAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalComplaintAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalComplaintAgreementEndsAtRangeRule implements SeasonalComplaintAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalComplaintAgreement): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalComplaintAgreementRequiredCategoryRule implements SeasonalComplaintAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalComplaintAgreement): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalComplaintAgreementCategoryLengthRule implements SeasonalComplaintAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalComplaintAgreement): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalComplaintAgreementRequiredCodeRule implements SeasonalComplaintAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalComplaintAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal complaint agreement. */
export class SeasonalComplaintAgreementValidator {
  rules: SeasonalComplaintAgreementRule[];

  constructor(rules: SeasonalComplaintAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalComplaintAgreement): string[] {
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

  requireValid(item: SeasonalComplaintAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalComplaintAgreement[]): Map<string, string[]> {
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

export function defaultSeasonalComplaintAgreementValidator(): SeasonalComplaintAgreementValidator {
  return new SeasonalComplaintAgreementValidator(
    [
      new SeasonalComplaintAgreementBudgetRangeRule(2.3, 4832.1),
      new SeasonalComplaintAgreementCodeLengthRule(255),
      new SeasonalComplaintAgreementEndsAtRangeRule(3600, 86400),
      new SeasonalComplaintAgreementRequiredCategoryRule("seasonal complaint agreement needs an entry"),
      new SeasonalComplaintAgreementCategoryLengthRule(16),
      new SeasonalComplaintAgreementRequiredCodeRule("seasonal complaint agreement needs this field"),
    ],
  );
}
