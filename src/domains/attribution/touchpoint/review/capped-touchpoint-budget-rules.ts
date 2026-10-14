import * as text from "../../../../kit/text.js";
import { CappedTouchpointBudget } from "./capped-touchpoint-budget.js";

/** A rule a capped touchpoint budget must pass. Check returns its problems, or none. */
export interface CappedTouchpointBudgetRule {
  check(item: CappedTouchpointBudget): string[];
}

export class CappedTouchpointBudgetCodeLengthRule implements CappedTouchpointBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTouchpointBudgetRequiredNameRule implements CappedTouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTouchpointBudgetRequiredContactEmailRule implements CappedTouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointBudget): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTouchpointBudgetRequiredChecksumRule implements CappedTouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointBudget): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTouchpointBudgetChecksumLengthRule implements CappedTouchpointBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointBudget): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTouchpointBudgetAllowedChecksumRule implements CappedTouchpointBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedTouchpointBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is out of range`];
    return [];
  }
}

/** Runs every rule of a capped touchpoint budget. */
export class CappedTouchpointBudgetValidator {
  rules: CappedTouchpointBudgetRule[];

  constructor(rules: CappedTouchpointBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTouchpointBudget): string[] {
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

  requireValid(item: CappedTouchpointBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTouchpointBudget[]): Map<string, string[]> {
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

export function defaultCappedTouchpointBudgetValidator(): CappedTouchpointBudgetValidator {
  return new CappedTouchpointBudgetValidator(
    [
      new CappedTouchpointBudgetCodeLengthRule(64),
      new CappedTouchpointBudgetRequiredNameRule("capped touchpoint budget needs this field"),
      new CappedTouchpointBudgetRequiredContactEmailRule("capped touchpoint budget needs this field"),
      new CappedTouchpointBudgetRequiredChecksumRule("capped touchpoint budget needs an entry"),
      new CappedTouchpointBudgetChecksumLengthRule(255),
      new CappedTouchpointBudgetAllowedChecksumRule(["regional", "weighted"]),
    ],
  );
}
