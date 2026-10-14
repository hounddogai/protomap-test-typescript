import * as text from "../../../../kit/text.js";
import { InviteBaseline } from "./invite-baseline.js";

/** A rule a invite baseline must pass. Check returns its problems, or none. */
export interface InviteBaselineRule {
  check(item: InviteBaseline): string[];
}

export class InviteBaselineCodePrefixRule implements InviteBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteBaselineLabelLengthRule implements InviteBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteBaselineRequiredLabelRule implements InviteBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InviteBaselineCohortLengthRule implements InviteBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteBaseline): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteBaselineAllowedCohortRule implements InviteBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

/** Runs every rule of a invite baseline. */
export class InviteBaselineValidator {
  rules: InviteBaselineRule[];

  constructor(rules: InviteBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: InviteBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: InviteBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteBaseline[]): Map<string, string[]> {
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

export function defaultInviteBaselineValidator(): InviteBaselineValidator {
  return new InviteBaselineValidator(
    [
      new InviteBaselineCodePrefixRule("X"),
      new InviteBaselineLabelLengthRule(80),
      new InviteBaselineRequiredLabelRule("invite baseline needs this field"),
      new InviteBaselineCohortLengthRule(120),
      new InviteBaselineAllowedCohortRule(["default", "lenient", "fallback"]),
    ],
  );
}
