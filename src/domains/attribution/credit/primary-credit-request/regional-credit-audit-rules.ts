import { RegionalCreditAudit } from "./regional-credit-audit.js";

/** A rule a regional credit audit must pass. Check returns its problems, or none. */
export interface RegionalCreditAuditRule {
  check(item: RegionalCreditAudit): string[];
}

export class RegionalCreditAuditThresholdRangeRule implements RegionalCreditAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreditAudit): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalCreditAuditRequiredCodeRule implements RegionalCreditAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreditAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreditAuditCodeLengthRule implements RegionalCreditAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCreditAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCreditAuditRequiredTitleRule implements RegionalCreditAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreditAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional credit audit. */
export class RegionalCreditAuditValidator {
  rules: RegionalCreditAuditRule[];

  constructor(rules: RegionalCreditAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCreditAudit): string[] {
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

  requireValid(item: RegionalCreditAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCreditAudit[]): Map<string, string[]> {
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

export function defaultRegionalCreditAuditValidator(): RegionalCreditAuditValidator {
  return new RegionalCreditAuditValidator(
    [
      new RegionalCreditAuditThresholdRangeRule(9.5, 922.2),
      new RegionalCreditAuditRequiredCodeRule("regional credit audit needs an entry"),
      new RegionalCreditAuditCodeLengthRule(1000),
      new RegionalCreditAuditRequiredTitleRule("regional credit audit needs this field"),
    ],
  );
}
