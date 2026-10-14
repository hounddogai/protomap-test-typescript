import * as text from "../../../../kit/text.js";
import { FunnelException } from "./funnel-exception.js";

/** A rule a funnel exception must pass. Check returns its problems, or none. */
export interface FunnelExceptionRule {
  check(item: FunnelException): string[];
}

export class FunnelExceptionAllowedCategoryRule implements FunnelExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is inconsistent`];
    return [];
  }
}

export class FunnelExceptionRequiredCodeRule implements FunnelExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelExceptionMarginRangeRule implements FunnelExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelException): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelExceptionCodeLengthRule implements FunnelExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel exception. */
export class FunnelExceptionValidator {
  rules: FunnelExceptionRule[];

  constructor(rules: FunnelExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelException[]): Map<string, string[]> {
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

export function defaultFunnelExceptionValidator(): FunnelExceptionValidator {
  return new FunnelExceptionValidator(
    [
      new FunnelExceptionAllowedCategoryRule(["adaptive"]),
      new FunnelExceptionRequiredCodeRule("funnel exception needs this field"),
      new FunnelExceptionMarginRangeRule(8, 4704.8),
      new FunnelExceptionCodeLengthRule(3600),
    ],
  );
}
