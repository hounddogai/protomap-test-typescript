import * as text from "../../../../kit/text.js";
import { CappedFunnelException } from "./capped-funnel-exception.js";

/** A rule a capped funnel exception must pass. Check returns its problems, or none. */
export interface CappedFunnelExceptionRule {
  check(item: CappedFunnelException): string[];
}

export class CappedFunnelExceptionAllowedCodeRule implements CappedFunnelExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedFunnelException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class CappedFunnelExceptionCodeLengthRule implements CappedFunnelExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFunnelException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFunnelExceptionDescriptionLengthRule implements CappedFunnelExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFunnelException): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFunnelExceptionBudgetRangeRule implements CappedFunnelExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFunnelException): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFunnelExceptionRequiredDescriptionRule implements CappedFunnelExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFunnelException): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped funnel exception. */
export class CappedFunnelExceptionValidator {
  rules: CappedFunnelExceptionRule[];

  constructor(rules: CappedFunnelExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFunnelException): string[] {
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

  requireValid(item: CappedFunnelException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFunnelException[]): Map<string, string[]> {
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

export function defaultCappedFunnelExceptionValidator(): CappedFunnelExceptionValidator {
  return new CappedFunnelExceptionValidator(
    [
      new CappedFunnelExceptionAllowedCodeRule(["tiered"]),
      new CappedFunnelExceptionCodeLengthRule(120),
      new CappedFunnelExceptionDescriptionLengthRule(120),
      new CappedFunnelExceptionBudgetRangeRule(2.2, 2862.9),
      new CappedFunnelExceptionRequiredDescriptionRule("capped funnel exception needs an entry"),
    ],
  );
}
