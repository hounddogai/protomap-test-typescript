import * as text from "../../../../kit/text.js";
import { BatchedSlaAudit } from "./batched-sla-audit.js";

/** A rule a batched sla audit must pass. Check returns its problems, or none. */
export interface BatchedSlaAuditRule {
  check(item: BatchedSlaAudit): string[];
}

export class BatchedSlaAuditRequiredExternalRefRule implements BatchedSlaAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSlaAudit): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSlaAuditCostRangeRule implements BatchedSlaAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedSlaAudit): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedSlaAuditArchivedGuardRule implements BatchedSlaAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedSlaAudit): string[] {
    if (item.archived && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class BatchedSlaAuditRequiredNameRule implements BatchedSlaAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSlaAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSlaAuditAllowedReviewerRule implements BatchedSlaAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedSlaAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is stale`];
    return [];
  }
}

export class BatchedSlaAuditRequiredReviewerRule implements BatchedSlaAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSlaAudit): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched sla audit. */
export class BatchedSlaAuditValidator {
  rules: BatchedSlaAuditRule[];

  constructor(rules: BatchedSlaAuditRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSlaAudit): string[] {
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

  requireValid(item: BatchedSlaAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSlaAudit[]): Map<string, string[]> {
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

export function defaultBatchedSlaAuditValidator(): BatchedSlaAuditValidator {
  return new BatchedSlaAuditValidator(
    [
      new BatchedSlaAuditRequiredExternalRefRule("batched sla audit needs an entry"),
      new BatchedSlaAuditCostRangeRule(7.8, 2641.2),
      new BatchedSlaAuditArchivedGuardRule(64),
      new BatchedSlaAuditRequiredNameRule("batched sla audit needs this field"),
      new BatchedSlaAuditAllowedReviewerRule([]),
      new BatchedSlaAuditRequiredReviewerRule("batched sla audit needs a value"),
    ],
  );
}
