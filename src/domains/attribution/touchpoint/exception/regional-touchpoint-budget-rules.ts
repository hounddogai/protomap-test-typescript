import * as text from "../../../../kit/text.js";
import { RegionalTouchpointBudget } from "./regional-touchpoint-budget.js";

/** A rule a regional touchpoint budget must pass. Check returns its problems, or none. */
export interface RegionalTouchpointBudgetRule {
  check(item: RegionalTouchpointBudget): string[];
}

export class RegionalTouchpointBudgetDescriptionLengthRule implements RegionalTouchpointBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalTouchpointBudget): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalTouchpointBudgetTitleLengthRule implements RegionalTouchpointBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalTouchpointBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalTouchpointBudgetAllowedCodeRule implements RegionalTouchpointBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalTouchpointBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class RegionalTouchpointBudgetVisibleGuardRule implements RegionalTouchpointBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalTouchpointBudget): string[] {
    if (item.visible && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RegionalTouchpointBudgetCodePrefixRule implements RegionalTouchpointBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalTouchpointBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalTouchpointBudgetRequiredCodeRule implements RegionalTouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalTouchpointBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional touchpoint budget. */
export class RegionalTouchpointBudgetValidator {
  rules: RegionalTouchpointBudgetRule[];

  constructor(rules: RegionalTouchpointBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalTouchpointBudget): string[] {
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

  requireValid(item: RegionalTouchpointBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalTouchpointBudget[]): Map<string, string[]> {
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

export function defaultRegionalTouchpointBudgetValidator(): RegionalTouchpointBudgetValidator {
  return new RegionalTouchpointBudgetValidator(
    [
      new RegionalTouchpointBudgetDescriptionLengthRule(86400),
      new RegionalTouchpointBudgetTitleLengthRule(120),
      new RegionalTouchpointBudgetAllowedCodeRule(["strict", "default", "adaptive"]),
      new RegionalTouchpointBudgetVisibleGuardRule(3600),
      new RegionalTouchpointBudgetCodePrefixRule("X"),
      new RegionalTouchpointBudgetRequiredCodeRule("regional touchpoint budget needs an entry"),
    ],
  );
}
