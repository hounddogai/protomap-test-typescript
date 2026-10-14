import { PrimarySlaAgreement } from "./primary-sla-agreement.js";

/** A rule a primary sla agreement must pass. Check returns its problems, or none. */
export interface PrimarySlaAgreementRule {
  check(item: PrimarySlaAgreement): string[];
}

export class PrimarySlaAgreementTitleLengthRule implements PrimarySlaAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySlaAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySlaAgreementRequiredCodeRule implements PrimarySlaAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySlaAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySlaAgreementRequiredTitleRule implements PrimarySlaAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySlaAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary sla agreement. */
export class PrimarySlaAgreementValidator {
  rules: PrimarySlaAgreementRule[];

  constructor(rules: PrimarySlaAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySlaAgreement): string[] {
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

  requireValid(item: PrimarySlaAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySlaAgreement[]): Map<string, string[]> {
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

export function defaultPrimarySlaAgreementValidator(): PrimarySlaAgreementValidator {
  return new PrimarySlaAgreementValidator(
    [
      new PrimarySlaAgreementTitleLengthRule(86400),
      new PrimarySlaAgreementRequiredCodeRule("primary sla agreement needs this field"),
      new PrimarySlaAgreementRequiredTitleRule("primary sla agreement needs a value"),
    ],
  );
}
