import { PacingAgreement } from "./pacing-agreement.js";

/** A rule a pacing agreement must pass. Check returns its problems, or none. */
export interface PacingAgreementRule {
  check(item: PacingAgreement): string[];
}

export class PacingAgreementEndsAtRangeRule implements PacingAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingAgreement): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingAgreementRequiredCategoryRule implements PacingAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingAgreement): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PacingAgreementGraceDaysRangeRule implements PacingAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingAgreement): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingAgreementCodePrefixRule implements PacingAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pacing agreement. */
export class PacingAgreementValidator {
  rules: PacingAgreementRule[];

  constructor(rules: PacingAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PacingAgreement): string[] {
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

  requireValid(item: PacingAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingAgreement[]): Map<string, string[]> {
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

export function defaultPacingAgreementValidator(): PacingAgreementValidator {
  return new PacingAgreementValidator(
    [
      new PacingAgreementEndsAtRangeRule(3600, 86400),
      new PacingAgreementRequiredCategoryRule("pacing agreement needs this field"),
      new PacingAgreementGraceDaysRangeRule(80, 86400),
      new PacingAgreementCodePrefixRule("X"),
    ],
  );
}
