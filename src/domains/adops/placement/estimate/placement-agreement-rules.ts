import * as text from "../../../../kit/text.js";
import { PlacementAgreement } from "./placement-agreement.js";

/** A rule a placement agreement must pass. Check returns its problems, or none. */
export interface PlacementAgreementRule {
  check(item: PlacementAgreement): string[];
}

export class PlacementAgreementRetriesRangeRule implements PlacementAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementAgreement): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementAgreementContactEmailLengthRule implements PlacementAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementAgreement): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementAgreementCurrencyLengthRule implements PlacementAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementAgreement): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementAgreementAllowedCodeRule implements PlacementAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a placement agreement. */
export class PlacementAgreementValidator {
  rules: PlacementAgreementRule[];

  constructor(rules: PlacementAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementAgreement[]): Map<string, string[]> {
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

export function defaultPlacementAgreementValidator(): PlacementAgreementValidator {
  return new PlacementAgreementValidator(
    [
      new PlacementAgreementRetriesRangeRule(1000, 86400),
      new PlacementAgreementContactEmailLengthRule(64),
      new PlacementAgreementCurrencyLengthRule(64),
      new PlacementAgreementAllowedCodeRule(["regional", "primary"]),
    ],
  );
}
