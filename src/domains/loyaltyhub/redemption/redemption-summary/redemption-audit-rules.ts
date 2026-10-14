import { RedemptionAudit } from "./redemption-audit.js";

/** A rule a redemption audit must pass. Check returns its problems, or none. */
export interface RedemptionAuditRule {
  check(item: RedemptionAudit): string[];
}

export class RedemptionAuditCodeLengthRule implements RedemptionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAuditCapacityRangeRule implements RedemptionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionAudit): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionAuditDurationMinutesRangeRule implements RedemptionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionAudit): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionAuditCurrencyLengthRule implements RedemptionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAudit): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAuditVersionRangeRule implements RedemptionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionAudit): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionAuditRequiredCodeRule implements RedemptionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption audit. */
export class RedemptionAuditValidator {
  rules: RedemptionAuditRule[];

  constructor(rules: RedemptionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionAudit[]): Map<string, string[]> {
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

export function defaultRedemptionAuditValidator(): RedemptionAuditValidator {
  return new RedemptionAuditValidator(
    [
      new RedemptionAuditCodeLengthRule(3600),
      new RedemptionAuditCapacityRangeRule(120, 255),
      new RedemptionAuditDurationMinutesRangeRule(64, 120),
      new RedemptionAuditCurrencyLengthRule(80),
      new RedemptionAuditVersionRangeRule(16, 80),
      new RedemptionAuditRequiredCodeRule("redemption audit needs an entry"),
    ],
  );
}
