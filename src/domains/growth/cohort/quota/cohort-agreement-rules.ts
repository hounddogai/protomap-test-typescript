import { CohortAgreement } from "./cohort-agreement.js";

/** A rule a cohort agreement must pass. Check returns its problems, or none. */
export interface CohortAgreementRule {
  check(item: CohortAgreement): string[];
}

export class CohortAgreementRequiredLabelRule implements CohortAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortAgreementCampaignRefLengthRule implements CohortAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortAgreement): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortAgreementCreatedAtRangeRule implements CohortAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortAgreement): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortAgreementVisibleGuardRule implements CohortAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CohortAgreement): string[] {
    if (item.visible && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CohortAgreementReviewerLengthRule implements CohortAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortAgreement): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort agreement. */
export class CohortAgreementValidator {
  rules: CohortAgreementRule[];

  constructor(rules: CohortAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: CohortAgreement): string[] {
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

  requireValid(item: CohortAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortAgreement[]): Map<string, string[]> {
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

export function defaultCohortAgreementValidator(): CohortAgreementValidator {
  return new CohortAgreementValidator(
    [
      new CohortAgreementRequiredLabelRule("cohort agreement needs this field"),
      new CohortAgreementCampaignRefLengthRule(80),
      new CohortAgreementCreatedAtRangeRule(255, 86400),
      new CohortAgreementVisibleGuardRule(3.8),
      new CohortAgreementReviewerLengthRule(120),
    ],
  );
}
