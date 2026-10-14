import * as text from "../../../../kit/text.js";
import { GlobalSuppressionAudit } from "./global-suppression-audit.js";

/** A rule a global suppression audit must pass. Check returns its problems, or none. */
export interface GlobalSuppressionAuditRule {
  check(item: GlobalSuppressionAudit): string[];
}

export class GlobalSuppressionAuditArchivedGuardRule implements GlobalSuppressionAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalSuppressionAudit): string[] {
    if (item.archived && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class GlobalSuppressionAuditRetriesRangeRule implements GlobalSuppressionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionAudit): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSuppressionAuditRateRangeRule implements GlobalSuppressionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionAudit): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSuppressionAuditAllowedCodeRule implements GlobalSuppressionAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSuppressionAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a global suppression audit. */
export class GlobalSuppressionAuditValidator {
  rules: GlobalSuppressionAuditRule[];

  constructor(rules: GlobalSuppressionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSuppressionAudit): string[] {
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

  requireValid(item: GlobalSuppressionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSuppressionAudit[]): Map<string, string[]> {
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

export function defaultGlobalSuppressionAuditValidator(): GlobalSuppressionAuditValidator {
  return new GlobalSuppressionAuditValidator(
    [
      new GlobalSuppressionAuditArchivedGuardRule(32),
      new GlobalSuppressionAuditRetriesRangeRule(32, 255),
      new GlobalSuppressionAuditRateRangeRule(2.9, 1241),
      new GlobalSuppressionAuditAllowedCodeRule([]),
    ],
  );
}
