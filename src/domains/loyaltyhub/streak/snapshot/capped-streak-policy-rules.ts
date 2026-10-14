import * as text from "../../../../kit/text.js";
import { CappedStreakPolicy } from "./capped-streak-policy.js";

/** A rule a capped streak policy must pass. Check returns its problems, or none. */
export interface CappedStreakPolicyRule {
  check(item: CappedStreakPolicy): string[];
}

export class CappedStreakPolicyRequiredLabelRule implements CappedStreakPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStreakPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStreakPolicyLabelLengthRule implements CappedStreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStreakPolicyAllowedLabelRule implements CappedStreakPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedStreakPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class CappedStreakPolicyCodeLengthRule implements CappedStreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped streak policy. */
export class CappedStreakPolicyValidator {
  rules: CappedStreakPolicyRule[];

  constructor(rules: CappedStreakPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStreakPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedStreakPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStreakPolicy[]): Map<string, string[]> {
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

export function defaultCappedStreakPolicyValidator(): CappedStreakPolicyValidator {
  return new CappedStreakPolicyValidator(
    [
      new CappedStreakPolicyRequiredLabelRule("capped streak policy needs a value"),
      new CappedStreakPolicyLabelLengthRule(3600),
      new CappedStreakPolicyAllowedLabelRule(["pending", "tiered", "strict"]),
      new CappedStreakPolicyCodeLengthRule(1000),
    ],
  );
}
