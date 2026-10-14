import { PrimaryPacingAgreement } from "./primary-pacing-agreement.js";

/** A rule a primary pacing agreement must pass. Check returns its problems, or none. */
export interface PrimaryPacingAgreementRule {
  check(item: PrimaryPacingAgreement): string[];
}

export class PrimaryPacingAgreementCampaignRefLengthRule implements PrimaryPacingAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPacingAgreement): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPacingAgreementRequiredLabelRule implements PrimaryPacingAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPacingAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPacingAgreementClicksRangeRule implements PrimaryPacingAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingAgreement): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary pacing agreement. */
export class PrimaryPacingAgreementValidator {
  rules: PrimaryPacingAgreementRule[];

  constructor(rules: PrimaryPacingAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPacingAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPacingAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPacingAgreement[]): Map<string, string[]> {
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

export function defaultPrimaryPacingAgreementValidator(): PrimaryPacingAgreementValidator {
  return new PrimaryPacingAgreementValidator(
    [
      new PrimaryPacingAgreementCampaignRefLengthRule(3600),
      new PrimaryPacingAgreementRequiredLabelRule("primary pacing agreement needs an entry"),
      new PrimaryPacingAgreementClicksRangeRule(64, 86400),
    ],
  );
}
