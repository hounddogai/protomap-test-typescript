import * as text from "../../../../kit/text.js";
import { FallbackBadgeBudget } from "./fallback-badge-budget.js";

/** A rule a fallback badge budget must pass. Check returns its problems, or none. */
export interface FallbackBadgeBudgetRule {
  check(item: FallbackBadgeBudget): string[];
}

export class FallbackBadgeBudgetContactEmailLengthRule implements FallbackBadgeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBadgeBudget): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBadgeBudgetAllowedCodeRule implements FallbackBadgeBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackBadgeBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class FallbackBadgeBudgetCodePrefixRule implements FallbackBadgeBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackBadgeBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackBadgeBudgetRequiredContactEmailRule implements FallbackBadgeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBadgeBudget): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBadgeBudgetRequiredDescriptionRule implements FallbackBadgeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBadgeBudget): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBadgeBudgetCodeLengthRule implements FallbackBadgeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBadgeBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback badge budget. */
export class FallbackBadgeBudgetValidator {
  rules: FallbackBadgeBudgetRule[];

  constructor(rules: FallbackBadgeBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBadgeBudget): string[] {
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

  requireValid(item: FallbackBadgeBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBadgeBudget[]): Map<string, string[]> {
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

export function defaultFallbackBadgeBudgetValidator(): FallbackBadgeBudgetValidator {
  return new FallbackBadgeBudgetValidator(
    [
      new FallbackBadgeBudgetContactEmailLengthRule(120),
      new FallbackBadgeBudgetAllowedCodeRule(["primary", "scheduled"]),
      new FallbackBadgeBudgetCodePrefixRule("X"),
      new FallbackBadgeBudgetRequiredContactEmailRule("fallback badge budget needs this field"),
      new FallbackBadgeBudgetRequiredDescriptionRule("fallback badge budget needs this field"),
      new FallbackBadgeBudgetCodeLengthRule(120),
    ],
  );
}
