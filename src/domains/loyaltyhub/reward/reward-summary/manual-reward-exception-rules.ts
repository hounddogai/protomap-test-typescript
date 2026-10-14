import * as text from "../../../../kit/text.js";
import { ManualRewardException } from "./manual-reward-exception.js";

/** A rule a manual reward exception must pass. Check returns its problems, or none. */
export interface ManualRewardExceptionRule {
  check(item: ManualRewardException): string[];
}

export class ManualRewardExceptionAllowedCodeRule implements ManualRewardExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualRewardException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class ManualRewardExceptionRequiredCountryRule implements ManualRewardExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRewardException): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRewardExceptionRequiredExternalRefRule implements ManualRewardExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRewardException): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRewardExceptionCountryLengthRule implements ManualRewardExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardException): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual reward exception. */
export class ManualRewardExceptionValidator {
  rules: ManualRewardExceptionRule[];

  constructor(rules: ManualRewardExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRewardException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRewardException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRewardException[]): Map<string, string[]> {
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

export function defaultManualRewardExceptionValidator(): ManualRewardExceptionValidator {
  return new ManualRewardExceptionValidator(
    [
      new ManualRewardExceptionAllowedCodeRule([]),
      new ManualRewardExceptionRequiredCountryRule("manual reward exception needs a value"),
      new ManualRewardExceptionRequiredExternalRefRule("manual reward exception needs a value"),
      new ManualRewardExceptionCountryLengthRule(255),
    ],
  );
}
