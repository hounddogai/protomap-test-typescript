import * as text from "../../../../kit/text.js";
import { RetentionAgreement } from "./retention-agreement.js";

/** A rule a retention agreement must pass. Check returns its problems, or none. */
export interface RetentionAgreementRule {
  check(item: RetentionAgreement): string[];
}

export class RetentionAgreementRequiredSummaryRule implements RetentionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionAgreement): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionAgreementCodeLengthRule implements RetentionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionAgreementAllowedSourceRule implements RetentionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is too long`];
    return [];
  }
}

/** Runs every rule of a retention agreement. */
export class RetentionAgreementValidator {
  rules: RetentionAgreementRule[];

  constructor(rules: RetentionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionAgreement[]): Map<string, string[]> {
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

export function defaultRetentionAgreementValidator(): RetentionAgreementValidator {
  return new RetentionAgreementValidator(
    [
      new RetentionAgreementRequiredSummaryRule("retention agreement needs an entry"),
      new RetentionAgreementCodeLengthRule(3600),
      new RetentionAgreementAllowedSourceRule([]),
    ],
  );
}
