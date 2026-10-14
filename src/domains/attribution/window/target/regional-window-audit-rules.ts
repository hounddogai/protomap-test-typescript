import { RegionalWindowAudit } from "./regional-window-audit.js";

/** A rule a regional window audit must pass. Check returns its problems, or none. */
export interface RegionalWindowAuditRule {
  check(item: RegionalWindowAudit): string[];
}

export class RegionalWindowAuditNameLengthRule implements RegionalWindowAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalWindowAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalWindowAuditRequiredChannelRule implements RegionalWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalWindowAudit): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalWindowAuditDiscountRangeRule implements RegionalWindowAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalWindowAudit): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional window audit. */
export class RegionalWindowAuditValidator {
  rules: RegionalWindowAuditRule[];

  constructor(rules: RegionalWindowAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalWindowAudit): string[] {
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

  requireValid(item: RegionalWindowAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalWindowAudit[]): Map<string, string[]> {
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

export function defaultRegionalWindowAuditValidator(): RegionalWindowAuditValidator {
  return new RegionalWindowAuditValidator(
    [
      new RegionalWindowAuditNameLengthRule(3600),
      new RegionalWindowAuditRequiredChannelRule("regional window audit needs an entry"),
      new RegionalWindowAuditDiscountRangeRule(2.7, 3851.7),
    ],
  );
}
