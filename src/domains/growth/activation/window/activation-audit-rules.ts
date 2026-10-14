import { ActivationAudit } from "./activation-audit.js";

/** A rule a activation audit must pass. Check returns its problems, or none. */
export interface ActivationAuditRule {
  check(item: ActivationAudit): string[];
}

export class ActivationAuditWindowDaysRangeRule implements ActivationAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationAudit): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationAuditRetriesRangeRule implements ActivationAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationAudit): string[] {
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

export class ActivationAuditRequiredCodeRule implements ActivationAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationAuditTitleLengthRule implements ActivationAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationAuditRequiredTitleRule implements ActivationAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationAuditCodeLengthRule implements ActivationAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation audit. */
export class ActivationAuditValidator {
  rules: ActivationAuditRule[];

  constructor(rules: ActivationAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationAudit): string[] {
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

  requireValid(item: ActivationAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationAudit[]): Map<string, string[]> {
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

export function defaultActivationAuditValidator(): ActivationAuditValidator {
  return new ActivationAuditValidator(
    [
      new ActivationAuditWindowDaysRangeRule(32, 80),
      new ActivationAuditRetriesRangeRule(64, 86400),
      new ActivationAuditRequiredCodeRule("activation audit needs a value"),
      new ActivationAuditTitleLengthRule(1000),
      new ActivationAuditRequiredTitleRule("activation audit needs a value"),
      new ActivationAuditCodeLengthRule(1000),
    ],
  );
}
