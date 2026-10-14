import * as text from "../../../../kit/text.js";
import { PrimaryConversionAudit } from "./primary-conversion-audit.js";

/** A rule a primary conversion audit must pass. Check returns its problems, or none. */
export interface PrimaryConversionAuditRule {
  check(item: PrimaryConversionAudit): string[];
}

export class PrimaryConversionAuditMarginRangeRule implements PrimaryConversionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionAudit): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryConversionAuditRequiredTitleRule implements PrimaryConversionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionAuditAllowedCodeRule implements PrimaryConversionAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryConversionAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a primary conversion audit. */
export class PrimaryConversionAuditValidator {
  rules: PrimaryConversionAuditRule[];

  constructor(rules: PrimaryConversionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryConversionAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryConversionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryConversionAudit[]): Map<string, string[]> {
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

export function defaultPrimaryConversionAuditValidator(): PrimaryConversionAuditValidator {
  return new PrimaryConversionAuditValidator(
    [
      new PrimaryConversionAuditMarginRangeRule(2.4, 4006.8),
      new PrimaryConversionAuditRequiredTitleRule("primary conversion audit needs this field"),
      new PrimaryConversionAuditAllowedCodeRule([]),
    ],
  );
}
