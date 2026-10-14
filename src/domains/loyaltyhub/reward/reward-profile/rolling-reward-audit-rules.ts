import * as text from "../../../../kit/text.js";
import { RollingRewardAudit } from "./rolling-reward-audit.js";

/** A rule a rolling reward audit must pass. Check returns its problems, or none. */
export interface RollingRewardAuditRule {
  check(item: RollingRewardAudit): string[];
}

export class RollingRewardAuditRequiredNameRule implements RollingRewardAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRewardAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRewardAuditCodeLengthRule implements RollingRewardAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRewardAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRewardAuditPriorityRangeRule implements RollingRewardAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingRewardAudit): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingRewardAuditAllowedCodeRule implements RollingRewardAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingRewardAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class RollingRewardAuditTitleLengthRule implements RollingRewardAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRewardAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRewardAuditNameLengthRule implements RollingRewardAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRewardAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling reward audit. */
export class RollingRewardAuditValidator {
  rules: RollingRewardAuditRule[];

  constructor(rules: RollingRewardAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RollingRewardAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingRewardAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingRewardAudit[]): Map<string, string[]> {
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

export function defaultRollingRewardAuditValidator(): RollingRewardAuditValidator {
  return new RollingRewardAuditValidator(
    [
      new RollingRewardAuditRequiredNameRule("rolling reward audit needs a value"),
      new RollingRewardAuditCodeLengthRule(16),
      new RollingRewardAuditPriorityRangeRule(16, 1000),
      new RollingRewardAuditAllowedCodeRule([]),
      new RollingRewardAuditTitleLengthRule(64),
      new RollingRewardAuditNameLengthRule(1000),
    ],
  );
}
