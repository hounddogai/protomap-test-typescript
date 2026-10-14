import * as text from "../../../../kit/text.js";
import { PacingRule } from "./pacing-rule.js";

/** A rule a pacing rule must pass. Check returns its problems, or none. */
export interface PacingRuleRule {
  check(item: PacingRule): string[];
}

export class PacingRuleCodePrefixRule implements PacingRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingRuleTitleLengthRule implements PacingRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingRuleCodeLengthRule implements PacingRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingRuleAllowedCodeRule implements PacingRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class PacingRulePinnedGuardRule implements PacingRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingRule): string[] {
    if (item.pinned && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PacingRuleRequiredTitleRule implements PacingRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing rule. */
export class PacingRuleValidator {
  rules: PacingRuleRule[];

  constructor(rules: PacingRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PacingRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingRule[]): Map<string, string[]> {
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

export function defaultPacingRuleValidator(): PacingRuleValidator {
  return new PacingRuleValidator(
    [
      new PacingRuleCodePrefixRule("Q"),
      new PacingRuleTitleLengthRule(1000),
      new PacingRuleCodeLengthRule(86400),
      new PacingRuleAllowedCodeRule([]),
      new PacingRulePinnedGuardRule(255),
      new PacingRuleRequiredTitleRule("pacing rule needs an entry"),
    ],
  );
}
