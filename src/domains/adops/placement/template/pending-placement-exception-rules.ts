import * as text from "../../../../kit/text.js";
import { PendingPlacementException } from "./pending-placement-exception.js";

/** A rule a pending placement exception must pass. Check returns its problems, or none. */
export interface PendingPlacementExceptionRule {
  check(item: PendingPlacementException): string[];
}

export class PendingPlacementExceptionTitleLengthRule implements PendingPlacementExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPlacementException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPlacementExceptionEndsAtRangeRule implements PendingPlacementExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPlacementException): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingPlacementExceptionAllowedCodeRule implements PendingPlacementExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingPlacementException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class PendingPlacementExceptionArchivedGuardRule implements PendingPlacementExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingPlacementException): string[] {
    if (item.archived && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PendingPlacementExceptionMaximumRangeRule implements PendingPlacementExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPlacementException): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pending placement exception. */
export class PendingPlacementExceptionValidator {
  rules: PendingPlacementExceptionRule[];

  constructor(rules: PendingPlacementExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPlacementException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPlacementException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPlacementException[]): Map<string, string[]> {
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

export function defaultPendingPlacementExceptionValidator(): PendingPlacementExceptionValidator {
  return new PendingPlacementExceptionValidator(
    [
      new PendingPlacementExceptionTitleLengthRule(86400),
      new PendingPlacementExceptionEndsAtRangeRule(3600, 86400),
      new PendingPlacementExceptionAllowedCodeRule([]),
      new PendingPlacementExceptionArchivedGuardRule(64),
      new PendingPlacementExceptionMaximumRangeRule(5.8, 581),
    ],
  );
}
