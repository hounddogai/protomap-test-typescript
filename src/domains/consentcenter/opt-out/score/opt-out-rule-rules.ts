import * as text from "../../../../kit/text.js";
import { OptOutRule } from "./opt-out-rule.js";

/** A rule a opt out rule must pass. Check returns its problems, or none. */
export interface OptOutRuleRule {
  check(item: OptOutRule): string[];
}

export class OptOutRuleRequiredTitleRule implements OptOutRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutRuleReviewerLengthRule implements OptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutRule): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutRuleRequiredUtmSourceRule implements OptOutRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutRule): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutRuleTitleLengthRule implements OptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutRuleAllowedReviewerRule implements OptOutRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is below minimum`];
    return [];
  }
}

export class OptOutRuleCodeLengthRule implements OptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a opt out rule. */
export class OptOutRuleValidator {
  rules: OptOutRuleRule[];

  constructor(rules: OptOutRuleRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutRule): string[] {
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

  requireValid(item: OptOutRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutRule[]): Map<string, string[]> {
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

export function defaultOptOutRuleValidator(): OptOutRuleValidator {
  return new OptOutRuleValidator(
    [
      new OptOutRuleRequiredTitleRule("opt out rule needs an entry"),
      new OptOutRuleReviewerLengthRule(80),
      new OptOutRuleRequiredUtmSourceRule("opt out rule needs a value"),
      new OptOutRuleTitleLengthRule(255),
      new OptOutRuleAllowedReviewerRule(["lenient", "primary"]),
      new OptOutRuleCodeLengthRule(255),
    ],
  );
}
