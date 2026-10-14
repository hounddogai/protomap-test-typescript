import * as text from "../../../../kit/text.js";
import { RollingOptOutAgreement } from "./rolling-opt-out-agreement.js";

/** A rule a rolling opt out agreement must pass. Check returns its problems, or none. */
export interface RollingOptOutAgreementRule {
  check(item: RollingOptOutAgreement): string[];
}

export class RollingOptOutAgreementLabelLengthRule implements RollingOptOutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutAgreementRequiredDescriptionRule implements RollingOptOutAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutAgreement): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutAgreementAllowedCountryRule implements RollingOptOutAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingOptOutAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is missing`];
    return [];
  }
}

/** Runs every rule of a rolling opt out agreement. */
export class RollingOptOutAgreementValidator {
  rules: RollingOptOutAgreementRule[];

  constructor(rules: RollingOptOutAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RollingOptOutAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingOptOutAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingOptOutAgreement[]): Map<string, string[]> {
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

export function defaultRollingOptOutAgreementValidator(): RollingOptOutAgreementValidator {
  return new RollingOptOutAgreementValidator(
    [
      new RollingOptOutAgreementLabelLengthRule(86400),
      new RollingOptOutAgreementRequiredDescriptionRule("rolling opt out agreement needs an entry"),
      new RollingOptOutAgreementAllowedCountryRule([]),
    ],
  );
}
