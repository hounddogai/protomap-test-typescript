import * as text from "../../../../kit/text.js";
import { GlobalWindowAudit } from "./global-window-audit.js";

/** A rule a global window audit must pass. Check returns its problems, or none. */
export interface GlobalWindowAuditRule {
  check(item: GlobalWindowAudit): string[];
}

export class GlobalWindowAuditNameLengthRule implements GlobalWindowAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWindowAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWindowAuditGraceDaysRangeRule implements GlobalWindowAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalWindowAudit): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalWindowAuditRequiredCodeRule implements GlobalWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWindowAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalWindowAuditAllowedDescriptionRule implements GlobalWindowAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalWindowAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is not allowed`];
    return [];
  }
}

export class GlobalWindowAuditCodeLengthRule implements GlobalWindowAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWindowAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global window audit. */
export class GlobalWindowAuditValidator {
  rules: GlobalWindowAuditRule[];

  constructor(rules: GlobalWindowAuditRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalWindowAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalWindowAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalWindowAudit[]): Map<string, string[]> {
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

export function defaultGlobalWindowAuditValidator(): GlobalWindowAuditValidator {
  return new GlobalWindowAuditValidator(
    [
      new GlobalWindowAuditNameLengthRule(1000),
      new GlobalWindowAuditGraceDaysRangeRule(120, 1000),
      new GlobalWindowAuditRequiredCodeRule("global window audit needs a value"),
      new GlobalWindowAuditAllowedDescriptionRule([]),
      new GlobalWindowAuditCodeLengthRule(32),
    ],
  );
}
