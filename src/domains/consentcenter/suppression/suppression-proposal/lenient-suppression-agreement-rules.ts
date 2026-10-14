import * as text from "../../../../kit/text.js";
import { LenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

/** A rule a lenient suppression agreement must pass. Check returns its problems, or none. */
export interface LenientSuppressionAgreementRule {
  check(item: LenientSuppressionAgreement): string[];
}

export class LenientSuppressionAgreementRequiredRegionRule implements LenientSuppressionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSuppressionAgreement): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSuppressionAgreementAllowedRegionRule implements LenientSuppressionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientSuppressionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is below minimum`];
    return [];
  }
}

export class LenientSuppressionAgreementThresholdRangeRule implements LenientSuppressionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSuppressionAgreement): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSuppressionAgreementLabelLengthRule implements LenientSuppressionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSuppressionAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSuppressionAgreementRequiredCodeRule implements LenientSuppressionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSuppressionAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient suppression agreement. */
export class LenientSuppressionAgreementValidator {
  rules: LenientSuppressionAgreementRule[];

  constructor(rules: LenientSuppressionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSuppressionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientSuppressionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSuppressionAgreement[]): Map<string, string[]> {
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

export function defaultLenientSuppressionAgreementValidator(): LenientSuppressionAgreementValidator {
  return new LenientSuppressionAgreementValidator(
    [
      new LenientSuppressionAgreementRequiredRegionRule("lenient suppression agreement needs this field"),
      new LenientSuppressionAgreementAllowedRegionRule(["adaptive", "lenient", "rolling"]),
      new LenientSuppressionAgreementThresholdRangeRule(9.6, 4362),
      new LenientSuppressionAgreementLabelLengthRule(86400),
      new LenientSuppressionAgreementRequiredCodeRule("lenient suppression agreement needs a value"),
    ],
  );
}
