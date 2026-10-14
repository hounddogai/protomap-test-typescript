import * as text from "../../../../kit/text.js";
import { LegacyPacingBudget } from "./legacy-pacing-budget.js";

/** A rule a legacy pacing budget must pass. Check returns its problems, or none. */
export interface LegacyPacingBudgetRule {
  check(item: LegacyPacingBudget): string[];
}

export class LegacyPacingBudgetCodeLengthRule implements LegacyPacingBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingBudgetRequiredPhoneRule implements LegacyPacingBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPacingBudget): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPacingBudgetNameLengthRule implements LegacyPacingBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingBudgetPhoneLengthRule implements LegacyPacingBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingBudget): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingBudgetAllowedNameRule implements LegacyPacingBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyPacingBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class LegacyPacingBudgetRequiredCodeRule implements LegacyPacingBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPacingBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy pacing budget. */
export class LegacyPacingBudgetValidator {
  rules: LegacyPacingBudgetRule[];

  constructor(rules: LegacyPacingBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPacingBudget): string[] {
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

  requireValid(item: LegacyPacingBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPacingBudget[]): Map<string, string[]> {
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

export function defaultLegacyPacingBudgetValidator(): LegacyPacingBudgetValidator {
  return new LegacyPacingBudgetValidator(
    [
      new LegacyPacingBudgetCodeLengthRule(80),
      new LegacyPacingBudgetRequiredPhoneRule("legacy pacing budget needs this field"),
      new LegacyPacingBudgetNameLengthRule(80),
      new LegacyPacingBudgetPhoneLengthRule(1000),
      new LegacyPacingBudgetAllowedNameRule([]),
      new LegacyPacingBudgetRequiredCodeRule("legacy pacing budget needs a value"),
    ],
  );
}
