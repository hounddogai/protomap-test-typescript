import { RollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

/** A rule a rolling bid rule audit must pass. Check returns its problems, or none. */
export interface RollingBidRuleAuditRule {
  check(item: RollingBidRuleAudit): string[];
}

export class RollingBidRuleAuditRevisionRangeRule implements RollingBidRuleAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBidRuleAudit): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingBidRuleAuditSourceLengthRule implements RollingBidRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleAudit): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBidRuleAuditRequiredLocaleRule implements RollingBidRuleAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBidRuleAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBidRuleAuditCodeLengthRule implements RollingBidRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBidRuleAuditBidRangeRule implements RollingBidRuleAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBidRuleAudit): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingBidRuleAuditRequiredCodeRule implements RollingBidRuleAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBidRuleAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling bid rule audit. */
export class RollingBidRuleAuditValidator {
  rules: RollingBidRuleAuditRule[];

  constructor(rules: RollingBidRuleAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBidRuleAudit): string[] {
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

  requireValid(item: RollingBidRuleAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBidRuleAudit[]): Map<string, string[]> {
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

export function defaultRollingBidRuleAuditValidator(): RollingBidRuleAuditValidator {
  return new RollingBidRuleAuditValidator(
    [
      new RollingBidRuleAuditRevisionRangeRule(16, 80),
      new RollingBidRuleAuditSourceLengthRule(120),
      new RollingBidRuleAuditRequiredLocaleRule("rolling bid rule audit needs this field"),
      new RollingBidRuleAuditCodeLengthRule(32),
      new RollingBidRuleAuditBidRangeRule(4.7, 4768.9),
      new RollingBidRuleAuditRequiredCodeRule("rolling bid rule audit needs this field"),
    ],
  );
}
