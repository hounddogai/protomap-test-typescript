import * as text from "../../../../kit/text.js";
import { CreditAdjustment } from "./credit-adjustment.js";

/** A rule a credit adjustment must pass. Check returns its problems, or none. */
export interface CreditAdjustmentRule {
  check(item: CreditAdjustment): string[];
}

export class CreditAdjustmentCodeLengthRule implements CreditAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAdjustmentRequiredReviewerRule implements CreditAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditAdjustment): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class CreditAdjustmentRequiredTitleRule implements CreditAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreditAdjustmentAllowedCodeRule implements CreditAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class CreditAdjustmentRequiredCodeRule implements CreditAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit adjustment. */
export class CreditAdjustmentValidator {
  rules: CreditAdjustmentRule[];

  constructor(rules: CreditAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: CreditAdjustment): string[] {
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

  requireValid(item: CreditAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditAdjustment[]): Map<string, string[]> {
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

export function defaultCreditAdjustmentValidator(): CreditAdjustmentValidator {
  return new CreditAdjustmentValidator(
    [
      new CreditAdjustmentCodeLengthRule(80),
      new CreditAdjustmentRequiredReviewerRule("credit adjustment needs a value"),
      new CreditAdjustmentRequiredTitleRule("credit adjustment needs this field"),
      new CreditAdjustmentAllowedCodeRule(["strict"]),
      new CreditAdjustmentRequiredCodeRule("credit adjustment needs a value"),
    ],
  );
}
