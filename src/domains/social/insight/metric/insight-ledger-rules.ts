import * as text from "../../../../kit/text.js";
import { InsightLedger } from "./insight-ledger.js";

/** A rule a insight ledger must pass. Check returns its problems, or none. */
export interface InsightLedgerRule {
  check(item: InsightLedger): string[];
}

export class InsightLedgerFrequencyCapRangeRule implements InsightLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightLedger): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightLedgerCodeLengthRule implements InsightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightLedgerRequiredCategoryRule implements InsightLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightLedger): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class InsightLedgerAllowedCodeRule implements InsightLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class InsightLedgerTitleLengthRule implements InsightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightLedgerRequiredTitleRule implements InsightLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight ledger. */
export class InsightLedgerValidator {
  rules: InsightLedgerRule[];

  constructor(rules: InsightLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: InsightLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightLedger[]): Map<string, string[]> {
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

export function defaultInsightLedgerValidator(): InsightLedgerValidator {
  return new InsightLedgerValidator(
    [
      new InsightLedgerFrequencyCapRangeRule(255, 1000),
      new InsightLedgerCodeLengthRule(1000),
      new InsightLedgerRequiredCategoryRule("insight ledger needs a value"),
      new InsightLedgerAllowedCodeRule(["capped", "lenient"]),
      new InsightLedgerTitleLengthRule(120),
      new InsightLedgerRequiredTitleRule("insight ledger needs this field"),
    ],
  );
}
