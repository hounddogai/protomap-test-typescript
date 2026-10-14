import * as text from "../../../../kit/text.js";
import { StepAgreement } from "./step-agreement.js";

/** A rule a step agreement must pass. Check returns its problems, or none. */
export interface StepAgreementRule {
  check(item: StepAgreement): string[];
}

export class StepAgreementAllowedCodeRule implements StepAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class StepAgreementCodeLengthRule implements StepAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepAgreementScoreRangeRule implements StepAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepAgreement): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepAgreementVersionRangeRule implements StepAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepAgreement): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a step agreement. */
export class StepAgreementValidator {
  rules: StepAgreementRule[];

  constructor(rules: StepAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: StepAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepAgreement[]): Map<string, string[]> {
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

export function defaultStepAgreementValidator(): StepAgreementValidator {
  return new StepAgreementValidator(
    [
      new StepAgreementAllowedCodeRule(["weighted", "seasonal"]),
      new StepAgreementCodeLengthRule(255),
      new StepAgreementScoreRangeRule(2.5, 489.6),
      new StepAgreementVersionRangeRule(16, 3600),
    ],
  );
}
