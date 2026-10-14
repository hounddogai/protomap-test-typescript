import { ScheduledComplaintAudit } from "./scheduled-complaint-audit.js";

/** A rule a scheduled complaint audit must pass. Check returns its problems, or none. */
export interface ScheduledComplaintAuditRule {
  check(item: ScheduledComplaintAudit): string[];
}

export class ScheduledComplaintAuditCodePrefixRule implements ScheduledComplaintAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledComplaintAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledComplaintAuditDescriptionLengthRule implements ScheduledComplaintAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledComplaintAudit): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledComplaintAuditCodeLengthRule implements ScheduledComplaintAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledComplaintAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledComplaintAuditMinimumRangeRule implements ScheduledComplaintAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledComplaintAudit): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled complaint audit. */
export class ScheduledComplaintAuditValidator {
  rules: ScheduledComplaintAuditRule[];

  constructor(rules: ScheduledComplaintAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledComplaintAudit): string[] {
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

  requireValid(item: ScheduledComplaintAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledComplaintAudit[]): Map<string, string[]> {
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

export function defaultScheduledComplaintAuditValidator(): ScheduledComplaintAuditValidator {
  return new ScheduledComplaintAuditValidator(
    [
      new ScheduledComplaintAuditCodePrefixRule("OPS"),
      new ScheduledComplaintAuditDescriptionLengthRule(255),
      new ScheduledComplaintAuditCodeLengthRule(16),
      new ScheduledComplaintAuditMinimumRangeRule(8.1, 3456.4),
    ],
  );
}
