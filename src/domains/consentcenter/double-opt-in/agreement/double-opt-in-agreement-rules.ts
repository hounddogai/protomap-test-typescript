import { DoubleOptInAgreement } from "./double-opt-in-agreement.js";

/** A rule a double opt in agreement must pass. Check returns its problems, or none. */
export interface DoubleOptInAgreementRule {
  check(item: DoubleOptInAgreement): string[];
}

export class DoubleOptInAgreementCodeLengthRule implements DoubleOptInAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInAgreementRequiredNameRule implements DoubleOptInAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInAgreementRequiredLabelRule implements DoubleOptInAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in agreement. */
export class DoubleOptInAgreementValidator {
  rules: DoubleOptInAgreementRule[];

  constructor(rules: DoubleOptInAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInAgreement): string[] {
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

  requireValid(item: DoubleOptInAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInAgreement[]): Map<string, string[]> {
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

export function defaultDoubleOptInAgreementValidator(): DoubleOptInAgreementValidator {
  return new DoubleOptInAgreementValidator(
    [
      new DoubleOptInAgreementCodeLengthRule(255),
      new DoubleOptInAgreementRequiredNameRule("double opt in agreement needs a value"),
      new DoubleOptInAgreementRequiredLabelRule("double opt in agreement needs this field"),
    ],
  );
}
