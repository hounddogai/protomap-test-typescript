import { InsightAudit } from "./insight-audit.js";

/** A rule a insight audit must pass. Check returns its problems, or none. */
export interface InsightAuditRule {
  check(item: InsightAudit): string[];
}

export class InsightAuditUtmSourceLengthRule implements InsightAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightAudit): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightAuditCountryLengthRule implements InsightAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightAudit): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightAuditRequiredNameRule implements InsightAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InsightAuditRequiredCodeRule implements InsightAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightAuditAmountRangeRule implements InsightAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightAudit): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightAuditRequiredCountryRule implements InsightAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightAudit): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight audit. */
export class InsightAuditValidator {
  rules: InsightAuditRule[];

  constructor(rules: InsightAuditRule[]) {
    this.rules = rules;
  }

  validate(item: InsightAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightAudit[]): Map<string, string[]> {
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

export function defaultInsightAuditValidator(): InsightAuditValidator {
  return new InsightAuditValidator(
    [
      new InsightAuditUtmSourceLengthRule(3600),
      new InsightAuditCountryLengthRule(120),
      new InsightAuditRequiredNameRule("insight audit needs an entry"),
      new InsightAuditRequiredCodeRule("insight audit needs an entry"),
      new InsightAuditAmountRangeRule(3.5, 2297.2),
      new InsightAuditRequiredCountryRule("insight audit needs an entry"),
    ],
  );
}
