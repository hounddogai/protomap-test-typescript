import * as text from "../../../../kit/text.js";
import { DeflectionAudit } from "./deflection-audit.js";

/** A rule a deflection audit must pass. Check returns its problems, or none. */
export interface DeflectionAuditRule {
  check(item: DeflectionAudit): string[];
}

export class DeflectionAuditAllowedCodeRule implements DeflectionAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class DeflectionAuditRequiredTitleRule implements DeflectionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionAuditActiveGuardRule implements DeflectionAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionAudit): string[] {
    if (item.active && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class DeflectionAuditClicksRangeRule implements DeflectionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionAudit): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionAuditLocaleLengthRule implements DeflectionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionAudit): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection audit. */
export class DeflectionAuditValidator {
  rules: DeflectionAuditRule[];

  constructor(rules: DeflectionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionAudit[]): Map<string, string[]> {
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

export function defaultDeflectionAuditValidator(): DeflectionAuditValidator {
  return new DeflectionAuditValidator(
    [
      new DeflectionAuditAllowedCodeRule(["batched", "seasonal", "legacy"]),
      new DeflectionAuditRequiredTitleRule("deflection audit needs this field"),
      new DeflectionAuditActiveGuardRule(86400),
      new DeflectionAuditClicksRangeRule(32, 255),
      new DeflectionAuditLocaleLengthRule(64),
    ],
  );
}
