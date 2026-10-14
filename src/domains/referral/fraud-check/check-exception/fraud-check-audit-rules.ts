import { FraudCheckAudit } from "./fraud-check-audit.js";

/** A rule a fraud check audit must pass. Check returns its problems, or none. */
export interface FraudCheckAuditRule {
  check(item: FraudCheckAudit): string[];
}

export class FraudCheckAuditCeilingRangeRule implements FraudCheckAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckAudit): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckAuditScoreRangeRule implements FraudCheckAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckAudit): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckAuditCodePrefixRule implements FraudCheckAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckAuditCodeLengthRule implements FraudCheckAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckAuditTitleLengthRule implements FraudCheckAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check audit. */
export class FraudCheckAuditValidator {
  rules: FraudCheckAuditRule[];

  constructor(rules: FraudCheckAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckAudit): string[] {
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

  requireValid(item: FraudCheckAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckAudit[]): Map<string, string[]> {
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

export function defaultFraudCheckAuditValidator(): FraudCheckAuditValidator {
  return new FraudCheckAuditValidator(
    [
      new FraudCheckAuditCeilingRangeRule(9.4, 2015),
      new FraudCheckAuditScoreRangeRule(1.9, 1346.4),
      new FraudCheckAuditCodePrefixRule("ACM"),
      new FraudCheckAuditCodeLengthRule(255),
      new FraudCheckAuditTitleLengthRule(16),
    ],
  );
}
