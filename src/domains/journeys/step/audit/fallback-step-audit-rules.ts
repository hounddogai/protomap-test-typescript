import * as text from "../../../../kit/text.js";
import { FallbackStepAudit } from "./fallback-step-audit.js";

/** A rule a fallback step audit must pass. Check returns its problems, or none. */
export interface FallbackStepAuditRule {
  check(item: FallbackStepAudit): string[];
}

export class FallbackStepAuditRequiredLocaleRule implements FallbackStepAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStepAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackStepAuditAmountRangeRule implements FallbackStepAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStepAudit): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackStepAuditAttemptsRangeRule implements FallbackStepAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStepAudit): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackStepAuditCodeLengthRule implements FallbackStepAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackStepAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackStepAuditAllowedAudienceIdRule implements FallbackStepAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackStepAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is stale`];
    return [];
  }
}

export class FallbackStepAuditVersionRangeRule implements FallbackStepAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStepAudit): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback step audit. */
export class FallbackStepAuditValidator {
  rules: FallbackStepAuditRule[];

  constructor(rules: FallbackStepAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackStepAudit): string[] {
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

  requireValid(item: FallbackStepAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackStepAudit[]): Map<string, string[]> {
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

export function defaultFallbackStepAuditValidator(): FallbackStepAuditValidator {
  return new FallbackStepAuditValidator(
    [
      new FallbackStepAuditRequiredLocaleRule("fallback step audit needs a value"),
      new FallbackStepAuditAmountRangeRule(0.8, 4537.8),
      new FallbackStepAuditAttemptsRangeRule(120, 3600),
      new FallbackStepAuditCodeLengthRule(120),
      new FallbackStepAuditAllowedAudienceIdRule([]),
      new FallbackStepAuditVersionRangeRule(255, 1000),
    ],
  );
}
