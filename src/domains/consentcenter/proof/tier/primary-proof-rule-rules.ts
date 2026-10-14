import * as text from "../../../../kit/text.js";
import { PrimaryProofRule } from "./primary-proof-rule.js";

/** A rule a primary proof rule must pass. Check returns its problems, or none. */
export interface PrimaryProofRuleRule {
  check(item: PrimaryProofRule): string[];
}

export class PrimaryProofRuleContactEmailLengthRule implements PrimaryProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofRule): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryProofRuleCodeLengthRule implements PrimaryProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryProofRuleLocaleLengthRule implements PrimaryProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofRule): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryProofRuleAllowedLabelRule implements PrimaryProofRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryProofRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class PrimaryProofRuleLabelLengthRule implements PrimaryProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary proof rule. */
export class PrimaryProofRuleValidator {
  rules: PrimaryProofRuleRule[];

  constructor(rules: PrimaryProofRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryProofRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryProofRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryProofRule[]): Map<string, string[]> {
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

export function defaultPrimaryProofRuleValidator(): PrimaryProofRuleValidator {
  return new PrimaryProofRuleValidator(
    [
      new PrimaryProofRuleContactEmailLengthRule(86400),
      new PrimaryProofRuleCodeLengthRule(64),
      new PrimaryProofRuleLocaleLengthRule(64),
      new PrimaryProofRuleAllowedLabelRule(["primary", "rolling"]),
      new PrimaryProofRuleLabelLengthRule(32),
    ],
  );
}
