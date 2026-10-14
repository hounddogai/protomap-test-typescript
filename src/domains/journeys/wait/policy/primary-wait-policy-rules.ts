import * as text from "../../../../kit/text.js";
import { PrimaryWaitPolicy } from "./primary-wait-policy.js";

/** A rule a primary wait policy must pass. Check returns its problems, or none. */
export interface PrimaryWaitPolicyRule {
  check(item: PrimaryWaitPolicy): string[];
}

export class PrimaryWaitPolicyCodeLengthRule implements PrimaryWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWaitPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryWaitPolicyAllowedCodeRule implements PrimaryWaitPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryWaitPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class PrimaryWaitPolicyRequiredSummaryRule implements PrimaryWaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWaitPolicy): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary wait policy. */
export class PrimaryWaitPolicyValidator {
  rules: PrimaryWaitPolicyRule[];

  constructor(rules: PrimaryWaitPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryWaitPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryWaitPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryWaitPolicy[]): Map<string, string[]> {
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

export function defaultPrimaryWaitPolicyValidator(): PrimaryWaitPolicyValidator {
  return new PrimaryWaitPolicyValidator(
    [
      new PrimaryWaitPolicyCodeLengthRule(16),
      new PrimaryWaitPolicyAllowedCodeRule([]),
      new PrimaryWaitPolicyRequiredSummaryRule("primary wait policy needs an entry"),
    ],
  );
}
