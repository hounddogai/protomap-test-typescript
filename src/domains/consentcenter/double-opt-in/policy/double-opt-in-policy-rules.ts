import * as text from "../../../../kit/text.js";
import { DoubleOptInPolicy } from "./double-opt-in-policy.js";

/** A rule a double opt in policy must pass. Check returns its problems, or none. */
export interface DoubleOptInPolicyRule {
  check(item: DoubleOptInPolicy): string[];
}

export class DoubleOptInPolicyCohortLengthRule implements DoubleOptInPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInPolicy): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInPolicyAllowedCodeRule implements DoubleOptInPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class DoubleOptInPolicyRequiredCohortRule implements DoubleOptInPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInPolicy): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInPolicyRequiredLabelRule implements DoubleOptInPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInPolicyRequiredCountryRule implements DoubleOptInPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInPolicy): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in policy. */
export class DoubleOptInPolicyValidator {
  rules: DoubleOptInPolicyRule[];

  constructor(rules: DoubleOptInPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInPolicy[]): Map<string, string[]> {
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

export function defaultDoubleOptInPolicyValidator(): DoubleOptInPolicyValidator {
  return new DoubleOptInPolicyValidator(
    [
      new DoubleOptInPolicyCohortLengthRule(64),
      new DoubleOptInPolicyAllowedCodeRule([]),
      new DoubleOptInPolicyRequiredCohortRule("double opt in policy needs a value"),
      new DoubleOptInPolicyRequiredLabelRule("double opt in policy needs this field"),
      new DoubleOptInPolicyRequiredCountryRule("double opt in policy needs this field"),
    ],
  );
}
