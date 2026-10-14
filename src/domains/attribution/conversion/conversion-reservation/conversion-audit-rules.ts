import { ConversionAudit } from "./conversion-audit.js";

/** A rule a conversion audit must pass. Check returns its problems, or none. */
export interface ConversionAuditRule {
  check(item: ConversionAudit): string[];
}

export class ConversionAuditRetriesRangeRule implements ConversionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionAudit): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionAuditMaximumRangeRule implements ConversionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionAudit): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionAuditDiscountRangeRule implements ConversionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionAudit): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a conversion audit. */
export class ConversionAuditValidator {
  rules: ConversionAuditRule[];

  constructor(rules: ConversionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionAudit[]): Map<string, string[]> {
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

export function defaultConversionAuditValidator(): ConversionAuditValidator {
  return new ConversionAuditValidator(
    [
      new ConversionAuditRetriesRangeRule(32, 120),
      new ConversionAuditMaximumRangeRule(4.8, 4905.1),
      new ConversionAuditDiscountRangeRule(7.7, 1501.2),
    ],
  );
}
