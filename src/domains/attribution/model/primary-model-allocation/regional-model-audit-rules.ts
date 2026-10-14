import { RegionalModelAudit } from "./regional-model-audit.js";

/** A rule a regional model audit must pass. Check returns its problems, or none. */
export interface RegionalModelAuditRule {
  check(item: RegionalModelAudit): string[];
}

export class RegionalModelAuditTitleLengthRule implements RegionalModelAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalModelAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalModelAuditNameLengthRule implements RegionalModelAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalModelAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalModelAuditAttemptsRangeRule implements RegionalModelAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalModelAudit): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional model audit. */
export class RegionalModelAuditValidator {
  rules: RegionalModelAuditRule[];

  constructor(rules: RegionalModelAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalModelAudit): string[] {
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

  requireValid(item: RegionalModelAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalModelAudit[]): Map<string, string[]> {
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

export function defaultRegionalModelAuditValidator(): RegionalModelAuditValidator {
  return new RegionalModelAuditValidator(
    [
      new RegionalModelAuditTitleLengthRule(80),
      new RegionalModelAuditNameLengthRule(255),
      new RegionalModelAuditAttemptsRangeRule(120, 86400),
    ],
  );
}
