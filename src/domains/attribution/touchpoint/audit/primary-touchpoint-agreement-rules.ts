import * as text from "../../../../kit/text.js";
import { PrimaryTouchpointAgreement } from "./primary-touchpoint-agreement.js";

/** A rule a primary touchpoint agreement must pass. Check returns its problems, or none. */
export interface PrimaryTouchpointAgreementRule {
  check(item: PrimaryTouchpointAgreement): string[];
}

export class PrimaryTouchpointAgreementUtmSourceLengthRule implements PrimaryTouchpointAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTouchpointAgreement): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTouchpointAgreementRequiredCodeRule implements PrimaryTouchpointAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTouchpointAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTouchpointAgreementAllowedUtmSourceRule implements PrimaryTouchpointAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryTouchpointAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is duplicated`];
    return [];
  }
}

export class PrimaryTouchpointAgreementCodeLengthRule implements PrimaryTouchpointAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTouchpointAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTouchpointAgreementQuantityRangeRule implements PrimaryTouchpointAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTouchpointAgreement): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryTouchpointAgreementLabelLengthRule implements PrimaryTouchpointAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTouchpointAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary touchpoint agreement. */
export class PrimaryTouchpointAgreementValidator {
  rules: PrimaryTouchpointAgreementRule[];

  constructor(rules: PrimaryTouchpointAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTouchpointAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryTouchpointAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTouchpointAgreement[]): Map<string, string[]> {
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

export function defaultPrimaryTouchpointAgreementValidator(): PrimaryTouchpointAgreementValidator {
  return new PrimaryTouchpointAgreementValidator(
    [
      new PrimaryTouchpointAgreementUtmSourceLengthRule(3600),
      new PrimaryTouchpointAgreementRequiredCodeRule("primary touchpoint agreement needs this field"),
      new PrimaryTouchpointAgreementAllowedUtmSourceRule([]),
      new PrimaryTouchpointAgreementCodeLengthRule(3600),
      new PrimaryTouchpointAgreementQuantityRangeRule(32, 64),
      new PrimaryTouchpointAgreementLabelLengthRule(1000),
    ],
  );
}
