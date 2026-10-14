import * as text from "../../../../kit/text.js";
import { CappedFunnelBatch } from "./capped-funnel-batch.js";

/** A rule a capped funnel batch must pass. Check returns its problems, or none. */
export interface CappedFunnelBatchRule {
  check(item: CappedFunnelBatch): string[];
}

export class CappedFunnelBatchVisibleGuardRule implements CappedFunnelBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedFunnelBatch): string[] {
    if (item.visible && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CappedFunnelBatchRequiredTitleRule implements CappedFunnelBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFunnelBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFunnelBatchAllowedNameRule implements CappedFunnelBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedFunnelBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class CappedFunnelBatchCreatedAtRangeRule implements CappedFunnelBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFunnelBatch): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped funnel batch. */
export class CappedFunnelBatchValidator {
  rules: CappedFunnelBatchRule[];

  constructor(rules: CappedFunnelBatchRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFunnelBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedFunnelBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFunnelBatch[]): Map<string, string[]> {
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

export function defaultCappedFunnelBatchValidator(): CappedFunnelBatchValidator {
  return new CappedFunnelBatchValidator(
    [
      new CappedFunnelBatchVisibleGuardRule(120),
      new CappedFunnelBatchRequiredTitleRule("capped funnel batch needs a value"),
      new CappedFunnelBatchAllowedNameRule([]),
      new CappedFunnelBatchCreatedAtRangeRule(64, 80),
    ],
  );
}
